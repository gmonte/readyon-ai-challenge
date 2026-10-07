import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as t from "../../db/schema";
import { DomainError } from "../../errors";
import { createTestDb, type TestDb } from "../../test/db";
import {
  actorFor,
  addMembership,
  anonymousActor,
  createLocation,
  createUser,
  integrationActor,
  seedScenario,
} from "../../test/fixtures";
import {
  approveAttendanceRequest,
  cancelAttendanceRequest,
  getAttendanceFeed,
  getOffBalance,
  markAttendance,
  recordIntegrationAttendance,
  rejectAttendanceRequest,
  submitAttendanceRequest,
} from "./service";

let tdb: TestDb;
beforeAll(async () => {
  tdb = await createTestDb();
});
afterAll(async () => {
  await tdb.close();
});
beforeEach(async () => {
  await tdb.reset();
});

const DATE = "2026-10-07";

async function expectDomainError(p: Promise<unknown>, code: DomainError["code"]) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof DomainError && e.code === code);
}

describe("submitAttendanceRequest", () => {
  it("creates a PENDING request for OFF and does not touch attendance", async () => {
    const s = await seedScenario(tdb.db);
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, {
      locationId: s.location.id,
      date: DATE,
      type: "OFF",
      note: "Family event",
    });
    expect(req.status).toBe("PENDING");
    expect(req.workerId).toBe(s.worker.id);
    const records = await tdb.db.select().from(t.attendanceRecords);
    expect(records).toHaveLength(0);
  });

  it("auto-approves PRESENT when Self check-in is enabled and writes the record", async () => {
    const s = await seedScenario(tdb.db, { selfCheckInEnabled: true });
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, {
      locationId: s.location.id,
      date: DATE,
      type: "PRESENT",
      checkInAt: "2026-10-07T08:00:00Z",
    });
    expect(req.status).toBe("APPROVED");
    const [record] = await tdb.db.select().from(t.attendanceRecords);
    expect(record).toMatchObject({ state: "PRESENT", source: "WORKER_REQUEST", requestId: req.id });
    expect(record!.checkInAt?.toISOString()).toBe("2026-10-07T08:00:00.000Z");
  });

  it("leaves PRESENT pending when Self check-in is disabled", async () => {
    const s = await seedScenario(tdb.db, { selfCheckInEnabled: false });
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, {
      locationId: s.location.id,
      date: DATE,
      type: "PRESENT",
    });
    expect(req.status).toBe("PENDING");
  });

  it("keeps OFF pending even when Self check-in is enabled", async () => {
    const s = await seedScenario(tdb.db, { selfCheckInEnabled: true });
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    expect(req.status).toBe("PENDING");
  });

  it("rejects a second open request for the same date with CONFLICT", async () => {
    const s = await seedScenario(tdb.db);
    await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    await expectDomainError(
      submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "PRESENT" }),
      "CONFLICT",
    );
  });

  it("allows a new request after the previous one was rejected or cancelled", async () => {
    const s = await seedScenario(tdb.db);
    const first = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    await rejectAttendanceRequest(tdb.db, s.managerActor, first.id);
    const second = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    await cancelAttendanceRequest(tdb.db, s.workerActor, second.id);
    const third = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    expect(third.status).toBe("PENDING");
  });

  it("refuses workers who do not belong to the location, managers, and anonymous callers", async () => {
    const s = await seedScenario(tdb.db);
    const other = await createLocation(tdb.db);
    await expectDomainError(
      submitAttendanceRequest(tdb.db, s.workerActor, { locationId: other.id, date: DATE, type: "OFF" }),
      "FORBIDDEN",
    );
    await expectDomainError(
      submitAttendanceRequest(tdb.db, s.managerActor, { locationId: s.location.id, date: DATE, type: "OFF" }),
      "FORBIDDEN",
    );
    await expectDomainError(
      submitAttendanceRequest(tdb.db, anonymousActor, { locationId: s.location.id, date: DATE, type: "OFF" }),
      "UNAUTHENTICATED",
    );
  });

  it("validates input shape with zod", async () => {
    const s = await seedScenario(tdb.db);
    await expect(
      submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: "07/10/2026", type: "OFF" }),
    ).rejects.toThrow(/YYYY-MM-DD/);
    await expect(
      submitAttendanceRequest(tdb.db, s.workerActor, {
        locationId: s.location.id,
        date: DATE,
        type: "PRESENT",
        checkInAt: "2026-10-07T17:00:00Z",
        checkOutAt: "2026-10-07T08:00:00Z",
      }),
    ).rejects.toThrow(/Check-out must be after check-in/);
  });
});

describe("approve / reject / cancel", () => {
  it("approval writes the attendance record with source WORKER_REQUEST and reviewer", async () => {
    const s = await seedScenario(tdb.db);
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    const approved = await approveAttendanceRequest(tdb.db, s.managerActor, req.id);
    expect(approved).toMatchObject({ status: "APPROVED", reviewedById: s.manager.id });
    expect(approved.reviewedAt).toBeInstanceOf(Date);
    const [record] = await tdb.db.select().from(t.attendanceRecords);
    expect(record).toMatchObject({ workerId: s.worker.id, date: DATE, state: "OFF", source: "WORKER_REQUEST", requestId: req.id });
  });

  it("approval overwrites an existing record for that date (integration PRESENT becomes OFF)", async () => {
    const s = await seedScenario(tdb.db);
    await recordIntegrationAttendance(tdb.db, integrationActor, {
      externalId: s.worker.externalId!,
      locationId: s.location.id,
      date: DATE,
      state: "PRESENT",
    });
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    await approveAttendanceRequest(tdb.db, s.managerActor, req.id);
    const records = await tdb.db.select().from(t.attendanceRecords);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ state: "OFF", source: "WORKER_REQUEST", requestId: req.id });
  });

  it("rejection leaves attendance untouched", async () => {
    const s = await seedScenario(tdb.db);
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    const rejected = await rejectAttendanceRequest(tdb.db, s.managerActor, req.id);
    expect(rejected.status).toBe("REJECTED");
    expect(await tdb.db.select().from(t.attendanceRecords)).toHaveLength(0);
  });

  it("only managers of the request's location may decide it; super admins always may", async () => {
    const s = await seedScenario(tdb.db);
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    const elsewhere = await createLocation(tdb.db);
    const otherManager = await createUser(tdb.db, "MANAGER");
    await addMembership(tdb.db, otherManager.id, elsewhere.id);
    await expectDomainError(approveAttendanceRequest(tdb.db, await actorFor(tdb.db, otherManager.id), req.id), "FORBIDDEN");
    await expectDomainError(approveAttendanceRequest(tdb.db, s.workerActor, req.id), "FORBIDDEN");
    const admin = await createUser(tdb.db, "SUPER_ADMIN");
    const approved = await approveAttendanceRequest(tdb.db, await actorFor(tdb.db, admin.id), req.id);
    expect(approved.status).toBe("APPROVED");
  });

  it("rejects malformed ids as VALIDATION rather than a database error", async () => {
    const s = await seedScenario(tdb.db);
    await expect(approveAttendanceRequest(tdb.db, s.managerActor, "")).rejects.toThrow(/Invalid id/);
    await expect(cancelAttendanceRequest(tdb.db, s.workerActor, "not-a-uuid")).rejects.toThrow(/Invalid id/);
    await expectDomainError(approveAttendanceRequest(tdb.db, s.managerActor, "00000000-0000-0000-0000-000000000001"), "NOT_FOUND");
  });

  it("a decided request cannot be decided again", async () => {
    const s = await seedScenario(tdb.db);
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    await rejectAttendanceRequest(tdb.db, s.managerActor, req.id);
    await expectDomainError(approveAttendanceRequest(tdb.db, s.managerActor, req.id), "CONFLICT");
  });

  it("a worker cancels only their own pending request", async () => {
    const s = await seedScenario(tdb.db);
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    const stranger = await createUser(tdb.db, "WORKER");
    await expectDomainError(cancelAttendanceRequest(tdb.db, await actorFor(tdb.db, stranger.id), req.id), "FORBIDDEN");
    const cancelled = await cancelAttendanceRequest(tdb.db, s.workerActor, req.id);
    expect(cancelled.status).toBe("CANCELLED");
    await expectDomainError(cancelAttendanceRequest(tdb.db, s.workerActor, req.id), "CONFLICT");
  });
});

describe("markAttendance", () => {
  it("upserts a MANAGER-sourced record and keeps a pending request pending", async () => {
    const s = await seedScenario(tdb.db);
    const req = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    const record = await markAttendance(tdb.db, s.managerActor, {
      locationId: s.location.id,
      workerId: s.worker.id,
      date: DATE,
      state: "PRESENT",
    });
    expect(record).toMatchObject({ state: "PRESENT", source: "MANAGER", markedById: s.manager.id, requestId: null });
    const again = await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: DATE, state: "OFF" });
    expect(again.id).toBe(record.id);
    expect(again.state).toBe("OFF");
    const [stillPending] = await tdb.db.select().from(t.attendanceRequests).where(eq(t.attendanceRequests.id, req.id));
    expect(stillPending!.status).toBe("PENDING");
  });

  it("is refused when Manager attendance marking is disabled at the location", async () => {
    const s = await seedScenario(tdb.db, { managerMarkingEnabled: false });
    await expectDomainError(
      markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: DATE, state: "PRESENT" }),
      "FORBIDDEN",
    );
  });

  it("is refused for a worker who does not belong to the location", async () => {
    const s = await seedScenario(tdb.db);
    const outsider = await createUser(tdb.db, "WORKER");
    await expectDomainError(
      markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: outsider.id, date: DATE, state: "PRESENT" }),
      "VALIDATION",
    );
  });
});

describe("recordIntegrationAttendance", () => {
  it("identifies the worker by external id and requires the integration actor", async () => {
    const s = await seedScenario(tdb.db);
    const record = await recordIntegrationAttendance(tdb.db, integrationActor, {
      externalId: s.worker.externalId!,
      locationId: s.location.id,
      date: DATE,
      state: "PRESENT",
    });
    expect(record).toMatchObject({ workerId: s.worker.id, source: "INTEGRATION" });
    await expectDomainError(
      recordIntegrationAttendance(tdb.db, s.managerActor, { externalId: s.worker.externalId!, locationId: s.location.id, date: DATE, state: "PRESENT" }),
      "FORBIDDEN",
    );
    await expectDomainError(
      recordIntegrationAttendance(tdb.db, integrationActor, { externalId: "NOPE", locationId: s.location.id, date: DATE, state: "PRESENT" }),
      "NOT_FOUND",
    );
  });
});

describe("getAttendanceFeed", () => {
  it("merges records and requests into one entry per worker and date, pending first", async () => {
    const s = await seedScenario(tdb.db);
    await recordIntegrationAttendance(tdb.db, integrationActor, { externalId: s.worker.externalId!, locationId: s.location.id, date: "2026-10-05", state: "PRESENT" });
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: "2026-10-06", state: "PRESENT" });
    const pending = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: "2026-10-09", type: "OFF", note: "Out of town" });
    const approvedReq = await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: "2026-10-08", type: "OFF" });
    await approveAttendanceRequest(tdb.db, s.managerActor, approvedReq.id);

    const feed = await getAttendanceFeed(tdb.db, s.managerActor, { locationId: s.location.id });
    expect(feed.entries.map((e) => [e.date, e.state, e.source, e.request?.status ?? null])).toEqual([
      ["2026-10-09", "OFF", null, "PENDING"],
      ["2026-10-08", "OFF", "WORKER_REQUEST", "APPROVED"],
      ["2026-10-06", "PRESENT", "MANAGER", null],
      ["2026-10-05", "PRESENT", "INTEGRATION", null],
    ]);
    expect(feed.counts).toEqual({ all: 4, pending: 1, present: 2, off: 2 });
    expect(feed.entries[0]!.request!.id).toBe(pending.id);
    expect(feed.entries[0]!.jobTitle).toBe("Food server");
    expect(feed.entries[0]!.worker.name).toBe("Tom Reyes");

    const onlyPending = await getAttendanceFeed(tdb.db, s.managerActor, { locationId: s.location.id, filter: "PENDING" });
    expect(onlyPending.entries).toHaveLength(1);
    const onlyOff = await getAttendanceFeed(tdb.db, s.managerActor, { locationId: s.location.id, filter: "OFF" });
    expect(onlyOff.entries.map((e) => e.date)).toEqual(["2026-10-09", "2026-10-08"]);
  });

  it("shows a record together with a newer pending request for the same date", async () => {
    const s = await seedScenario(tdb.db);
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: DATE, state: "PRESENT" });
    await submitAttendanceRequest(tdb.db, s.workerActor, { locationId: s.location.id, date: DATE, type: "OFF" });
    const feed = await getAttendanceFeed(tdb.db, s.managerActor, { locationId: s.location.id });
    expect(feed.entries).toHaveLength(1);
    expect(feed.entries[0]).toMatchObject({ state: "PRESENT", source: "MANAGER" });
    expect(feed.entries[0]!.request?.status).toBe("PENDING");
    expect(feed.counts).toEqual({ all: 1, pending: 1, present: 1, off: 0 });
  });

  it("workers see only their own entries; outsiders see nothing", async () => {
    const s = await seedScenario(tdb.db);
    const colleague = await createUser(tdb.db, "WORKER", { externalId: "RO-9" });
    await addMembership(tdb.db, colleague.id, s.location.id, "Cook");
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: colleague.id, date: DATE, state: "PRESENT" });
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: DATE, state: "OFF" });

    const mine = await getAttendanceFeed(tdb.db, s.workerActor, { locationId: s.location.id });
    expect(mine.entries.map((e) => e.workerId)).toEqual([s.worker.id]);
    const outsider = await createUser(tdb.db, "WORKER");
    await expectDomainError(getAttendanceFeed(tdb.db, await actorFor(tdb.db, outsider.id), { locationId: s.location.id }), "FORBIDDEN");
  });
});

describe("getOffBalance", () => {
  it("counts OFF records at the location in the year against the allowance", async () => {
    const s = await seedScenario(tdb.db, { offDaysPerYear: 12 });
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: "2026-03-01", state: "OFF" });
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: "2026-03-02", state: "OFF" });
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: "2025-12-31", state: "OFF" });
    await markAttendance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, date: "2026-03-03", state: "PRESENT" });
    const balance = await getOffBalance(tdb.db, s.workerActor, { locationId: s.location.id, year: 2026 });
    expect(balance).toEqual({ year: 2026, allowance: 12, used: 2, remaining: 10 });
    const asManager = await getOffBalance(tdb.db, s.managerActor, { locationId: s.location.id, workerId: s.worker.id, year: 2026 });
    expect(asManager.remaining).toBe(10);
  });
});
