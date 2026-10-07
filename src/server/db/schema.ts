import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const ROLES = ["WORKER", "MANAGER", "SUPER_ADMIN"] as const;
export const ATTENDANCE_STATES = ["PRESENT", "OFF"] as const;
export const ATTENDANCE_SOURCES = ["MANAGER", "INTEGRATION", "WORKER_REQUEST"] as const;
export const REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

export const roleEnum = pgEnum("role", ROLES);
export const attendanceStateEnum = pgEnum("attendance_state", ATTENDANCE_STATES);
export const attendanceSourceEnum = pgEnum("attendance_source", ATTENDANCE_SOURCES);
export const requestStatusEnum = pgEnum("request_status", REQUEST_STATUSES);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

/** Owned by the `locations` module. The single company is implicit. */
export const locations = pgTable("locations", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  address: text().notNull(),
  selfCheckInEnabled: boolean().notNull().default(false),
  managerMarkingEnabled: boolean().notNull().default(true),
  offDaysPerYear: integer().notNull().default(12),
  ...timestamps,
});

/** Owned by the `identity` module. One global role per user. */
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  role: roleEnum().notNull(),
  /** Only workers carry one; third parties identify workers by it. */
  externalId: text().unique(),
  /** The fixed demo user the "Viewing as" switcher picks for this role. Simulated auth only. */
  isPersona: boolean().notNull().default(false),
  ...timestamps,
});

/** Owned by `identity`. A worker's or manager's membership at a location. */
export const locationMemberships = pgTable(
  "location_memberships",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    locationId: uuid()
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    /** Set for workers only: exactly one job title per location. */
    jobTitle: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex("location_memberships_user_location_uq").on(t.userId, t.locationId)],
);

/** Owned by `attendance`. See ADR 0001 for the (worker, date) key. */
export const attendanceRequests = pgTable(
  "attendance_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    workerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    locationId: uuid()
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    date: date({ mode: "string" }).notNull(),
    type: attendanceStateEnum().notNull(),
    status: requestStatusEnum().notNull().default("PENDING"),
    note: text(),
    checkInAt: timestamp({ withTimezone: true }),
    checkOutAt: timestamp({ withTimezone: true }),
    reviewedById: uuid().references(() => users.id),
    reviewedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    // One *open* request per worker per date; rejected/cancelled leave room.
    uniqueIndex("attendance_requests_open_per_worker_date_uq")
      .on(t.workerId, t.date)
      .where(sql`${t.status} in ('PENDING', 'APPROVED')`),
    index("attendance_requests_location_date_idx").on(t.locationId, t.date),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid().primaryKey().defaultRandom(),
    workerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    locationId: uuid()
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    date: date({ mode: "string" }).notNull(),
    state: attendanceStateEnum().notNull(),
    source: attendanceSourceEnum().notNull(),
    note: text(),
    checkInAt: timestamp({ withTimezone: true }),
    checkOutAt: timestamp({ withTimezone: true }),
    /** The approved request that produced this record, when source is WORKER_REQUEST. */
    requestId: uuid().references(() => attendanceRequests.id, { onDelete: "set null" }),
    /** The manager who marked it, when source is MANAGER. */
    markedById: uuid().references(() => users.id),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("attendance_records_worker_date_uq").on(t.workerId, t.date),
    index("attendance_records_location_date_idx").on(t.locationId, t.date),
  ],
);
