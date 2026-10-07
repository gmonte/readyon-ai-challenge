import { and, asc, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Actor } from "../../auth/actor";
import {
  requireIntegration,
  requireLocationAccess,
  requireManagerOf,
  requireUser,
  requireWorkerAt,
} from "../../auth/policy";
import * as t from "../../db/schema";
import type { Db } from "../../db/types";
import { conflict, forbidden, isUniqueViolation, notFound, validation } from "../../errors";
import { IdSchema } from "../../schemas";
import { UserSchema } from "../identity/schemas";
import {
  AttendanceFeedInputSchema,
  AttendanceFeedSchema,
  AttendanceRecordSchema,
  AttendanceRequestSchema,
  IntegrationAttendanceInputSchema,
  MarkAttendanceInputSchema,
  OffBalanceInputSchema,
  OffBalanceSchema,
  SubmitAttendanceRequestInputSchema,
  type AttendanceEntry,
  type AttendanceFeed,
  type AttendanceRecord,
  type AttendanceRequest,
  type OffBalance,
} from "./schemas";

// ---- helpers ---------------------------------------------------------------

async function getLocationOrThrow(db: Db, rawId: string) {
  const locationId = IdSchema.parse(rawId);
  const [location] = await db.select().from(t.locations).where(eq(t.locations.id, locationId)).limit(1);
  if (!location) throw notFound("Location");
  return location;
}

export async function getRequestById(db: Db, rawId: string): Promise<AttendanceRequest | null> {
  const id = IdSchema.parse(rawId);
  const [row] = await db.select().from(t.attendanceRequests).where(eq(t.attendanceRequests.id, id)).limit(1);
  return row ? AttendanceRequestSchema.parse(row) : null;
}

async function getRequestOrThrow(db: Db, id: string): Promise<AttendanceRequest> {
  const request = await getRequestById(db, id);
  if (!request) throw notFound("Attendance request");
  return request;
}

/** A worker must belong to the location an attendance record is written for. */
async function assertWorkerBelongs(db: Db, workerId: string, locationId: string) {
  const [row] = await db
    .select({ role: t.users.role })
    .from(t.locationMemberships)
    .innerJoin(t.users, eq(t.users.id, t.locationMemberships.userId))
    .where(and(eq(t.locationMemberships.userId, workerId), eq(t.locationMemberships.locationId, locationId)))
    .limit(1);
  if (!row || row.role !== "WORKER") throw validation("Worker does not belong to this location");
}

type RecordWrite = Omit<typeof t.attendanceRecords.$inferInsert, "id" | "createdAt" | "updatedAt">;

/** Exactly one record per worker per date (ADR 0001): writes are upserts on that key. */
async function upsertRecord(db: Db, values: RecordWrite): Promise<AttendanceRecord> {
  const [row] = await db
    .insert(t.attendanceRecords)
    .values(values)
    .onConflictDoUpdate({
      target: [t.attendanceRecords.workerId, t.attendanceRecords.date],
      set: {
        locationId: values.locationId,
        state: values.state,
        source: values.source,
        note: values.note ?? null,
        checkInAt: values.checkInAt ?? null,
        checkOutAt: values.checkOutAt ?? null,
        requestId: values.requestId ?? null,
        markedById: values.markedById ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return AttendanceRecordSchema.parse(row);
}

function recordFromRequest(request: AttendanceRequest): RecordWrite {
  return {
    workerId: request.workerId,
    locationId: request.locationId,
    date: request.date,
    state: request.type,
    source: "WORKER_REQUEST",
    note: request.note,
    checkInAt: request.checkInAt,
    checkOutAt: request.checkOutAt,
    requestId: request.id,
    markedById: null,
  };
}

// ---- reads -----------------------------------------------------------------

/**
 * The attendance table for one location: records merged with requests, one entry per worker and date.
 * Workers only ever see their own entries; managers and admins see everyone at the location.
 */
export async function getAttendanceFeed(db: Db, actor: Actor, rawInput: unknown): Promise<AttendanceFeed> {
  const input = AttendanceFeedInputSchema.parse(rawInput);
  const viewer = requireLocationAccess(actor, input.locationId);
  const ownOnly = viewer.user.role === "WORKER" ? viewer.user.id : null;

  const recordRows = await db
    .select({ record: t.attendanceRecords, linked: t.attendanceRequests })
    .from(t.attendanceRecords)
    .leftJoin(t.attendanceRequests, eq(t.attendanceRequests.id, t.attendanceRecords.requestId))
    .where(
      and(
        eq(t.attendanceRecords.locationId, input.locationId),
        ownOnly ? eq(t.attendanceRecords.workerId, ownOnly) : undefined,
      ),
    );

  const requestRows = await db
    .select()
    .from(t.attendanceRequests)
    .where(
      and(
        eq(t.attendanceRequests.locationId, input.locationId),
        ownOnly ? eq(t.attendanceRequests.workerId, ownOnly) : undefined,
      ),
    )
    .orderBy(desc(t.attendanceRequests.createdAt));

  type Draft = Omit<AttendanceEntry, "worker" | "jobTitle" | "id" | "state" | "source">;
  const drafts = new Map<string, Draft>();
  const keyOf = (workerId: string, date: string) => `${workerId}:${date}`;

  for (const { record, linked } of recordRows) {
    drafts.set(keyOf(record.workerId, record.date), {
      workerId: record.workerId,
      locationId: record.locationId,
      date: record.date,
      record: AttendanceRecordSchema.parse(record),
      request: linked ? AttendanceRequestSchema.parse(linked) : null,
    });
  }
  // Newest first: a pending request is always the newest for its date, so it wins.
  for (const row of requestRows) {
    const request = AttendanceRequestSchema.parse(row);
    const key = keyOf(request.workerId, request.date);
    const existing = drafts.get(key);
    if (!existing) {
      drafts.set(key, {
        workerId: request.workerId,
        locationId: request.locationId,
        date: request.date,
        record: null,
        request,
      });
    } else if (existing.record && request.status === "PENDING") {
      existing.request = request; // record exists *and* a newer ask is waiting
    }
  }

  const workerIds = [...new Set([...drafts.values()].map((d) => d.workerId))];
  const [users, memberships] =
    workerIds.length === 0
      ? [[], []]
      : await Promise.all([
          db.select().from(t.users).where(inArray(t.users.id, workerIds)),
          db
            .select({ userId: t.locationMemberships.userId, jobTitle: t.locationMemberships.jobTitle })
            .from(t.locationMemberships)
            .where(
              and(
                eq(t.locationMemberships.locationId, input.locationId),
                inArray(t.locationMemberships.userId, workerIds),
              ),
            ),
        ]);
  const userById = new Map(users.map((u) => [u.id, UserSchema.parse(u)]));
  const titleByUser = new Map(memberships.map((m) => [m.userId, m.jobTitle]));

  const all: AttendanceEntry[] = [...drafts.values()].flatMap((d) => {
    const worker = userById.get(d.workerId);
    if (!worker) return [];
    const state = d.record ? d.record.state : d.request!.type;
    return [
      {
        id: keyOf(d.workerId, d.date),
        ...d,
        worker,
        jobTitle: titleByUser.get(d.workerId) ?? null,
        state,
        source: d.record ? d.record.source : null,
      },
    ];
  });

  const isPending = (e: AttendanceEntry) => e.request?.status === "PENDING";
  all.sort((a, b) => {
    const p = Number(isPending(b)) - Number(isPending(a));
    if (p !== 0) return p;
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.worker.name.localeCompare(b.worker.name);
  });

  const counts = {
    all: all.length,
    pending: all.filter(isPending).length,
    present: all.filter((e) => e.state === "PRESENT").length,
    off: all.filter((e) => e.state === "OFF").length,
  };
  const entries =
    input.filter === "ALL"
      ? all
      : input.filter === "PENDING"
        ? all.filter(isPending)
        : all.filter((e) => e.state === input.filter);

  return AttendanceFeedSchema.parse({ entries, counts });
}

export async function countPendingRequests(db: Db, actor: Actor, rawLocationId: string): Promise<number> {
  const locationId = IdSchema.parse(rawLocationId);
  const viewer = requireLocationAccess(actor, locationId);
  const ownOnly = viewer.user.role === "WORKER" ? viewer.user.id : null;
  const [row] = await db
    .select({ n: count() })
    .from(t.attendanceRequests)
    .where(
      and(
        eq(t.attendanceRequests.locationId, locationId),
        eq(t.attendanceRequests.status, "PENDING"),
        ownOnly ? eq(t.attendanceRequests.workerId, ownOnly) : undefined,
      ),
    );
  return row?.n ?? 0;
}

/** Informational only: allowance at the location minus OFF days recorded there this year. */
export async function getOffBalance(db: Db, actor: Actor, rawInput: unknown): Promise<OffBalance> {
  const input = OffBalanceInputSchema.parse(rawInput);
  const viewer = requireLocationAccess(actor, input.locationId);
  const workerId = input.workerId ?? viewer.user.id;
  if (workerId !== viewer.user.id) requireManagerOf(actor, input.locationId);

  const location = await getLocationOrThrow(db, input.locationId);
  const year = input.year ?? new Date().getFullYear();
  const [row] = await db
    .select({ n: count() })
    .from(t.attendanceRecords)
    .where(
      and(
        eq(t.attendanceRecords.workerId, workerId),
        eq(t.attendanceRecords.locationId, input.locationId),
        eq(t.attendanceRecords.state, "OFF"),
        gte(t.attendanceRecords.date, `${year}-01-01`),
        lte(t.attendanceRecords.date, `${year}-12-31`),
      ),
    );
  const used = row?.n ?? 0;
  return OffBalanceSchema.parse({
    year,
    allowance: location.offDaysPerYear,
    used,
    remaining: location.offDaysPerYear - used,
  });
}

// ---- worker workflow -------------------------------------------------------

/**
 * A worker asks for a date to be PRESENT or OFF. OFF always waits for a manager.
 * PRESENT is approved on the spot when the location has Self check-in enabled.
 */
export async function submitAttendanceRequest(db: Db, actor: Actor, rawInput: unknown): Promise<AttendanceRequest> {
  const input = SubmitAttendanceRequestInputSchema.parse(rawInput);
  const worker = requireWorkerAt(actor, input.locationId);
  const location = await getLocationOrThrow(db, input.locationId);
  const autoApprove = input.type === "PRESENT" && location.selfCheckInEnabled;

  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(t.attendanceRequests)
        .values({
          workerId: worker.user.id,
          locationId: input.locationId,
          date: input.date,
          type: input.type,
          note: input.note ?? null,
          checkInAt: input.checkInAt ?? null,
          checkOutAt: input.checkOutAt ?? null,
          status: autoApprove ? "APPROVED" : "PENDING",
          reviewedAt: autoApprove ? new Date() : null,
        })
        .returning();
      const request = AttendanceRequestSchema.parse(row);
      if (autoApprove) await upsertRecord(tx, recordFromRequest(request));
      return request;
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("You already have an open request for this date");
    throw err;
  }
}

export async function cancelAttendanceRequest(db: Db, actor: Actor, id: string): Promise<AttendanceRequest> {
  const viewer = requireUser(actor);
  const request = await getRequestOrThrow(db, id);
  if (request.workerId !== viewer.user.id) throw forbidden("You can only cancel your own requests");
  if (request.status !== "PENDING") throw conflict(`Request is already ${request.status.toLowerCase()}`);
  const [row] = await db
    .update(t.attendanceRequests)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(t.attendanceRequests.id, id), eq(t.attendanceRequests.status, "PENDING")))
    .returning();
  if (!row) throw conflict("Request is no longer pending");
  return AttendanceRequestSchema.parse(row);
}

// ---- manager workflow ------------------------------------------------------

async function decideRequest(
  db: Db,
  actor: Actor,
  id: string,
  decision: "APPROVED" | "REJECTED",
): Promise<AttendanceRequest> {
  const request = await getRequestOrThrow(db, id);
  const manager = requireManagerOf(actor, request.locationId);
  if (request.status !== "PENDING") throw conflict(`Request is already ${request.status.toLowerCase()}`);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(t.attendanceRequests)
      .set({ status: decision, reviewedById: manager.user.id, reviewedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(t.attendanceRequests.id, id), eq(t.attendanceRequests.status, "PENDING")))
      .returning();
    if (!row) throw conflict("Request is no longer pending");
    const decided = AttendanceRequestSchema.parse(row);
    // "Once approved, the request updates the attendance record."
    if (decision === "APPROVED") await upsertRecord(tx, recordFromRequest(decided));
    return decided;
  });
}

export const approveAttendanceRequest = (db: Db, actor: Actor, id: string) => decideRequest(db, actor, id, "APPROVED");
export const rejectAttendanceRequest = (db: Db, actor: Actor, id: string) => decideRequest(db, actor, id, "REJECTED");

/** Direct marking by a manager. Gated by the location's Manager attendance marking flag. Leaves any pending request alone. */
export async function markAttendance(db: Db, actor: Actor, rawInput: unknown): Promise<AttendanceRecord> {
  const input = MarkAttendanceInputSchema.parse(rawInput);
  const manager = requireManagerOf(actor, input.locationId);
  const location = await getLocationOrThrow(db, input.locationId);
  if (!location.managerMarkingEnabled) throw forbidden("Manager attendance marking is disabled at this location");
  await assertWorkerBelongs(db, input.workerId, input.locationId);

  return upsertRecord(db, {
    workerId: input.workerId,
    locationId: input.locationId,
    date: input.date,
    state: input.state,
    source: "MANAGER",
    note: input.note ?? null,
    checkInAt: input.checkInAt ?? null,
    checkOutAt: input.checkOutAt ?? null,
    requestId: null,
    markedById: manager.user.id,
  });
}

// ---- third-party integrations ----------------------------------------------

/** Third parties identify the worker by external identifier, never by our ids. */
export async function recordIntegrationAttendance(db: Db, actor: Actor, rawInput: unknown): Promise<AttendanceRecord> {
  requireIntegration(actor);
  const input = IntegrationAttendanceInputSchema.parse(rawInput);
  const [worker] = await db
    .select({ id: t.users.id, role: t.users.role })
    .from(t.users)
    .where(eq(t.users.externalId, input.externalId))
    .limit(1);
  if (!worker || worker.role !== "WORKER") throw notFound(`Worker with external id ${input.externalId}`);
  await getLocationOrThrow(db, input.locationId);
  await assertWorkerBelongs(db, worker.id, input.locationId);

  return upsertRecord(db, {
    workerId: worker.id,
    locationId: input.locationId,
    date: input.date,
    state: input.state,
    source: "INTEGRATION",
    note: null,
    checkInAt: input.checkInAt ?? null,
    checkOutAt: input.checkOutAt ?? null,
    requestId: null,
    markedById: null,
  });
}

export async function listRequestsForWorker(db: Db, actor: Actor, rawLocationId: string) {
  const locationId = IdSchema.parse(rawLocationId);
  const viewer = requireLocationAccess(actor, locationId);
  const rows = await db
    .select()
    .from(t.attendanceRequests)
    .where(and(eq(t.attendanceRequests.locationId, locationId), eq(t.attendanceRequests.workerId, viewer.user.id)))
    .orderBy(asc(t.attendanceRequests.date));
  return rows.map((r) => AttendanceRequestSchema.parse(r));
}
