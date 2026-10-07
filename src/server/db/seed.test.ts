import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../test/db";
import { actorFor } from "../test/fixtures";
import { getAttendanceFeed } from "../modules/attendance/service";
import { listPersonas } from "../modules/identity/service";
import { seed } from "./seed";

let tdb: TestDb;
beforeAll(async () => {
  tdb = await createTestDb();
});
afterAll(() => tdb.close());

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
