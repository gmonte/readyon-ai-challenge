import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { UserSchema } from "../identity/schemas";
import {
  ATTENDANCE_SOURCES,
  ATTENDANCE_STATES,
  REQUEST_STATUSES,
  attendanceRecords,
  attendanceRequests,
} from "../../db/schema";

// ---- Value types -----------------------------------------------------------

export const AttendanceStateSchema = z.enum(ATTENDANCE_STATES);
export type AttendanceState = z.infer<typeof AttendanceStateSchema>;

export const AttendanceSourceSchema = z.enum(ATTENDANCE_SOURCES);
export type AttendanceSource = z.infer<typeof AttendanceSourceSchema>;

export const RequestStatusSchema = z.enum(REQUEST_STATUSES);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

/** Calendar date as `YYYY-MM-DD`. All locations share one time zone (agreed simplification). */
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "Invalid calendar date");
export type DateString = z.infer<typeof DateStringSchema>;

export const AttendanceFilterSchema = z.enum(["ALL", "PENDING", "PRESENT", "OFF"]);
export type AttendanceFilter = z.infer<typeof AttendanceFilterSchema>;

// ---- Entities (outputs) ----------------------------------------------------

export const AttendanceRecordSchema = createSelectSchema(attendanceRecords);
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

export const AttendanceRequestSchema = createSelectSchema(attendanceRequests);
export type AttendanceRequest = z.infer<typeof AttendanceRequestSchema>;

/** One row of the attendance table: a worker and a date. See CONTEXT.md "Attendance entry". */
export const AttendanceEntrySchema = z.object({
  id: z.string(),
  workerId: z.uuid(),
  locationId: z.uuid(),
  date: DateStringSchema,
  worker: UserSchema,
  jobTitle: z.string().nullable(),
  /** Record state, or the requested type while no record exists. */
  state: AttendanceStateSchema,
  /** Null while the entry only exists as a request ("on approval"). */
  source: AttendanceSourceSchema.nullable(),
  record: AttendanceRecordSchema.nullable(),
  request: AttendanceRequestSchema.nullable(),
});
export type AttendanceEntry = z.infer<typeof AttendanceEntrySchema>;

export const AttendanceCountsSchema = z.object({
  all: z.number().int(),
  pending: z.number().int(),
  present: z.number().int(),
  off: z.number().int(),
});

export const AttendanceFeedSchema = z.object({
  entries: z.array(AttendanceEntrySchema),
  counts: AttendanceCountsSchema,
});
export type AttendanceFeed = z.infer<typeof AttendanceFeedSchema>;

export const OffBalanceSchema = z.object({
  year: z.number().int(),
  allowance: z.number().int(),
  used: z.number().int(),
  remaining: z.number().int(),
});
export type OffBalance = z.infer<typeof OffBalanceSchema>;

// ---- Inputs ----------------------------------------------------------------

const timesInOrder = (v: { checkInAt?: Date | null; checkOutAt?: Date | null }) =>
  !v.checkInAt || !v.checkOutAt || v.checkOutAt > v.checkInAt;

const optionalTimes = {
  checkInAt: z.coerce.date().nullish(),
  checkOutAt: z.coerce.date().nullish(),
};

export const AttendanceFeedInputSchema = z.object({
  locationId: z.uuid(),
  filter: AttendanceFilterSchema.default("ALL"),
});

export const SubmitAttendanceRequestInputSchema = z
  .object({
    locationId: z.uuid(),
    date: DateStringSchema,
    type: AttendanceStateSchema,
    note: z.string().trim().max(500).nullish(),
    ...optionalTimes,
  })
  .refine(timesInOrder, { message: "Check-out must be after check-in", path: ["checkOutAt"] });
export type SubmitAttendanceRequestInput = z.infer<typeof SubmitAttendanceRequestInputSchema>;

export const MarkAttendanceInputSchema = z
  .object({
    locationId: z.uuid(),
    workerId: z.uuid(),
    date: DateStringSchema,
    state: AttendanceStateSchema,
    note: z.string().trim().max(500).nullish(),
    ...optionalTimes,
  })
  .refine(timesInOrder, { message: "Check-out must be after check-in", path: ["checkOutAt"] });
export type MarkAttendanceInput = z.infer<typeof MarkAttendanceInputSchema>;

export const IntegrationAttendanceInputSchema = z
  .object({
    externalId: z.string().trim().min(1),
    locationId: z.uuid(),
    date: DateStringSchema,
    state: AttendanceStateSchema,
    ...optionalTimes,
  })
  .refine(timesInOrder, { message: "Check-out must be after check-in", path: ["checkOutAt"] });
export type IntegrationAttendanceInput = z.infer<typeof IntegrationAttendanceInputSchema>;

export const OffBalanceInputSchema = z.object({
  locationId: z.uuid(),
  workerId: z.uuid().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});
