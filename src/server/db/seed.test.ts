import { asc } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as t from "./schema";
import { createTestDb, type TestDb } from "../test/db";
import { actorFor } from "../test/fixtures";
import { getAttendanceFeed } from "../modules/attendance/service";
import { listPersonas } from "../modules/identity/service";
import { seed, seedIfEmpty } from "./seed";

let tdb: TestDb;
beforeAll(async () => {
  tdb = await createTestDb();
});
afterAll(() => tdb.close());

describe("seedIfEmpty", () => {
  it("seeds a fresh database and leaves an existing one untouched", async () => {
    await tdb.reset();
    expect(await seedIfEmpty(tdb.db)).toBe("seeded");
    const manager = (await listPersonas(tdb.db)).find((p) => p.role === "MANAGER")!;
    const [boulder] = await tdb.db.select().from(t.locations).orderBy(asc(t.locations.name)).limit(1);
    const before = await getAttendanceFeed(tdb.db, await actorFor(tdb.db, manager.id), { locationId: boulder!.id });
    expect(await seedIfEmpty(tdb.db)).toBe("skipped");
    // Same request ids survive: nothing was truncated.
    const after = await getAttendanceFeed(tdb.db, await actorFor(tdb.db, manager.id), { locationId: before.entries[0]!.locationId });
    expect(after.entries[0]!.request!.id).toBe(before.entries[0]!.request!.id);
  });
});

describe("seed", () => {
  it("seeds a coherent demo set and is idempotent", async () => {
    await seed(tdb.db);
    const { locations, personas } = await seed(tdb.db);
    const list = await listPersonas(tdb.db);
    expect(list.map((p) => p.name)).toEqual(["Tom Reyes", "Megan Garcia", "Alex Rivera"]);
    const manager = await actorFor(tdb.db, personas.megan!.id);
    const feed = await getAttendanceFeed(tdb.db, manager, { locationId: locations[0]!.id });
    expect(feed.counts.pending).toBe(3);
    expect(feed.counts.all).toBeGreaterThan(10);
    expect(feed.entries[0]!.request?.status).toBe("PENDING");
  });
});
