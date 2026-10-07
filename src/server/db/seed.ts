/**
 * Seeds enough data to demo every workflow. Mirrors the mock-ups: Future Enterprises, three locations,
 * six workers, one manager, one super admin, and attendance around today. Idempotent: wipes and reseeds.
 */
import { count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as t from "./schema";
import type { Db } from "./types";

try {
  process.loadEnvFile();
} catch {
  // env already provided
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const daysFromToday = (n: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};
const at = (day: Date, hhmm: string) => new Date(`${isoDate(day)}T${hhmm}:00Z`);

/** True when the database already holds data, so a deploy-time seed should leave it alone. */
export async function hasData(db: Db): Promise<boolean> {
  const [row] = await db.select({ n: count() }).from(t.users);
  return (row?.n ?? 0) > 0;
}

/**
 * Seed unless data exists. Used by `vercel-build`: bootstraps a fresh database on first deploy and is a
 * no-op afterwards, so redeploys never wipe demo state.
 */
export async function seedIfEmpty(db: Db): Promise<"seeded" | "skipped"> {
  if (await hasData(db)) return "skipped";
  await seed(db);
  return "seeded";
}

export async function seed(db: Db) {
  await db.execute(
    sql`TRUNCATE TABLE attendance_records, attendance_requests, location_memberships, users, locations CASCADE`,
  );

  const [boulder, nrg, wembley] = await db
    .insert(t.locations)
    .values([
      { name: "Aramark Boulder CO", address: "Boulder, CO · 2440 Pearl St", selfCheckInEnabled: true, managerMarkingEnabled: true, offDaysPerYear: 12 },
      { name: "NRG Park", address: "Houston, TX · 1 NRG Pkwy", selfCheckInEnabled: false, managerMarkingEnabled: true, offDaysPerYear: 10 },
      { name: "Wembley Stadium", address: "London, UK · Wembley HA9", selfCheckInEnabled: true, managerMarkingEnabled: false, offDaysPerYear: 15 },
    ])
    .returning();

  // One flagged persona per role drives the "Viewing as" switcher.
  const [tom, megan, alex] = await db
    .insert(t.users)
    .values([
      { name: "Tom Reyes", role: "WORKER", externalId: "RO-1042", isPersona: true },
      { name: "Megan Garcia", role: "MANAGER", isPersona: true },
      { name: "Alex Rivera", role: "SUPER_ADMIN", isPersona: true },
    ])
    .returning();
  const [lin, meganPark, ari, jamie, priya, dana] = await db
    .insert(t.users)
    .values([
      { name: "Lin Huang", role: "WORKER", externalId: "RO-1043" },
      { name: "Megan Park", role: "WORKER", externalId: "RO-1044" },
      { name: "Ari Singh", role: "WORKER", externalId: "RO-1045" },
      { name: "Jamie Cole", role: "WORKER", externalId: "RO-1046" },
      { name: "Priya Nair", role: "WORKER", externalId: "RO-1049" },
      { name: "Dana Whitfield", role: "MANAGER" },
    ])
    .returning();

  await db.insert(t.locationMemberships).values([
    { userId: tom!.id, locationId: boulder!.id, jobTitle: "Food server" },
    { userId: tom!.id, locationId: nrg!.id, jobTitle: "Runner" },
    { userId: lin!.id, locationId: boulder!.id, jobTitle: "Cook" },
    { userId: meganPark!.id, locationId: boulder!.id, jobTitle: "Bartender" },
    { userId: ari!.id, locationId: boulder!.id, jobTitle: "Cashier" },
    { userId: jamie!.id, locationId: boulder!.id, jobTitle: "Concession" },
    { userId: priya!.id, locationId: boulder!.id, jobTitle: "Host" },
    { userId: priya!.id, locationId: wembley!.id, jobTitle: "Steward" },
    { userId: megan!.id, locationId: boulder!.id },
    { userId: megan!.id, locationId: nrg!.id },
    { userId: dana!.id, locationId: wembley!.id },
    { userId: alex!.id, locationId: boulder!.id },
  ]);

  const d = (n: number) => daysFromToday(n);

  // Pending requests at Boulder (what the manager sees first).
  await db.insert(t.attendanceRequests).values([
    { workerId: jamie!.id, locationId: boulder!.id, date: isoDate(d(0)), type: "PRESENT", status: "PENDING", note: "Check-in — badge scan failed at the gate.", checkInAt: at(d(0), "08:02") },
    { workerId: tom!.id, locationId: boulder!.id, date: isoDate(d(2)), type: "OFF", status: "PENDING", note: "Family event out of town." },
    { workerId: priya!.id, locationId: boulder!.id, date: isoDate(d(5)), type: "OFF", status: "PENDING", note: "Medical appointment in the morning." },
  ]);

  // An approved OFF request that already became a record.
  const [ariReq] = await db
    .insert(t.attendanceRequests)
    .values({
      workerId: ari!.id,
      locationId: boulder!.id,
      date: isoDate(d(-1)),
      type: "OFF",
      status: "APPROVED",
      note: "Moving day.",
      reviewedById: megan!.id,
      reviewedAt: at(d(-3), "16:10"),
    })
    .returning();

  // A rejected one, so the worker view shows the lifecycle.
  await db.insert(t.attendanceRequests).values({
    workerId: lin!.id,
    locationId: boulder!.id,
    date: isoDate(d(-4)),
    type: "OFF",
    status: "REJECTED",
    note: "Long weekend.",
    reviewedById: megan!.id,
    reviewedAt: at(d(-6), "09:30"),
  });

  await db.insert(t.attendanceRecords).values([
    { workerId: ari!.id, locationId: boulder!.id, date: isoDate(d(-1)), state: "OFF", source: "WORKER_REQUEST", requestId: ariReq!.id, note: "Moving day." },
    { workerId: tom!.id, locationId: boulder!.id, date: isoDate(d(0)), state: "PRESENT", source: "INTEGRATION", checkInAt: at(d(0), "07:58") },
    { workerId: lin!.id, locationId: boulder!.id, date: isoDate(d(0)), state: "PRESENT", source: "MANAGER", markedById: megan!.id, checkInAt: at(d(0), "08:05") },
    { workerId: meganPark!.id, locationId: boulder!.id, date: isoDate(d(0)), state: "PRESENT", source: "MANAGER", markedById: megan!.id },
    { workerId: lin!.id, locationId: boulder!.id, date: isoDate(d(-1)), state: "PRESENT", source: "INTEGRATION", checkInAt: at(d(-1), "08:01"), checkOutAt: at(d(-1), "16:32") },
    { workerId: tom!.id, locationId: boulder!.id, date: isoDate(d(-1)), state: "PRESENT", source: "INTEGRATION", checkInAt: at(d(-1), "07:55"), checkOutAt: at(d(-1), "16:05") },
    { workerId: tom!.id, locationId: boulder!.id, date: isoDate(d(-2)), state: "PRESENT", source: "MANAGER", markedById: megan!.id },
    { workerId: tom!.id, locationId: boulder!.id, date: isoDate(d(-9)), state: "OFF", source: "MANAGER", markedById: megan!.id, note: "Sick day" },
    { workerId: tom!.id, locationId: boulder!.id, date: isoDate(d(-30)), state: "OFF", source: "MANAGER", markedById: megan!.id },
    { workerId: jamie!.id, locationId: boulder!.id, date: isoDate(d(-1)), state: "PRESENT", source: "INTEGRATION", checkInAt: at(d(-1), "09:00") },
    { workerId: priya!.id, locationId: boulder!.id, date: isoDate(d(-1)), state: "OFF", source: "MANAGER", markedById: megan!.id },
    { workerId: meganPark!.id, locationId: boulder!.id, date: isoDate(d(-2)), state: "OFF", source: "MANAGER", markedById: megan!.id },
    // Other locations, so switching locations shows different data.
    { workerId: tom!.id, locationId: nrg!.id, date: isoDate(d(-14)), state: "PRESENT", source: "INTEGRATION" },
    { workerId: priya!.id, locationId: wembley!.id, date: isoDate(d(-3)), state: "PRESENT", source: "INTEGRATION" },
  ]);

  return { locations: [boulder, nrg, wembley], personas: { tom, megan, alex } };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const onlyIfEmpty = process.argv.includes("--if-empty");
  const client = postgres(url, { max: 1, prepare: !/-pooler\./.test(url) });
  const db = drizzle({ client, schema: t, casing: "snake_case" });
  try {
    if (onlyIfEmpty && (await hasData(db))) {
      console.log("Database already has data; seed skipped (--if-empty).");
      return;
    }
    const result = await seed(db);
    console.log(`Seeded ${result.locations.length} locations. Personas: ${Object.values(result.personas).map((u) => `${u!.name} (${u!.role})`).join(", ")}`);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
