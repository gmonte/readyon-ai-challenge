import type { AttendanceSource, AttendanceState, RequestStatus, Role } from "./gql/graphql";

export function parseDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDayLabel(yyyyMmDd: string): { main: string; year: string } {
  const d = parseDate(yyyyMmDd);
  return {
    main: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    year: String(d.getFullYear()),
  };
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = ["bg-blue-600", "bg-violet-600", "bg-rose-500", "bg-indigo-700", "bg-sky-600", "bg-fuchsia-600"];
export function avatarColor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

export const STATE_LABEL: Record<AttendanceState, string> = { PRESENT: "Present", OFF: "Off" };
export const SOURCE_LABEL: Record<AttendanceSource, string> = {
  MANAGER: "Manager",
  INTEGRATION: "Integration",
  WORKER_REQUEST: "Worker request",
};
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};
export const ROLE_LABEL: Record<Role, string> = { WORKER: "Worker", MANAGER: "Manager", SUPER_ADMIN: "Super admin" };

export function homeFor(role: Role): string {
  return role === "WORKER" ? "/my-attendance" : "/attendance";
}

/** Combine a YYYY-MM-DD date and HH:MM time (local) into an ISO string, or null when time is empty. */
export function combineDateTime(date: string, time: string): string | null {
  if (!time) return null;
  return new Date(`${date}T${time}:00`).toISOString();
}
