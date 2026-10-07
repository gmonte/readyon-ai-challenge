import { asc, count, eq, inArray } from "drizzle-orm";
import type { Actor } from "../../auth/actor";
import { isSuperAdmin, requireLocationAccess, requireSuperAdmin, requireUser } from "../../auth/policy";
import * as t from "../../db/schema";
import type { Db } from "../../db/types";
import { notFound } from "../../errors";
import { IdSchema } from "../../schemas";
import { LocationSchema, SetLocationFeatureFlagsInputSchema, type Location } from "./schemas";

/** Admins see every location; everyone else sees the locations they belong to. */
export async function listLocations(db: Db, actor: Actor): Promise<Location[]> {
  const viewer = requireUser(actor);
  if (!isSuperAdmin(viewer) && viewer.locationIds.length === 0) return [];
  const rows = await db
    .select()
    .from(t.locations)
    .where(isSuperAdmin(viewer) ? undefined : inArray(t.locations.id, viewer.locationIds))
    .orderBy(asc(t.locations.name));
  return rows.map((r) => LocationSchema.parse(r));
}

export async function getLocation(db: Db, actor: Actor, rawId: string): Promise<Location> {
  const id = IdSchema.parse(rawId);
  requireLocationAccess(actor, id);
  const [row] = await db.select().from(t.locations).where(eq(t.locations.id, id)).limit(1);
  if (!row) throw notFound("Location");
  return LocationSchema.parse(row);
}

export async function getLocationsByIds(db: Db, ids: readonly string[]): Promise<Location[]> {
  if (ids.length === 0) return [];
  const rows = await db.select().from(t.locations).where(inArray(t.locations.id, [...ids]));
  return rows.map((r) => LocationSchema.parse(r));
}

export type LocationCounts = { locationId: string; workers: number; managers: number };

export async function getLocationCounts(db: Db, ids: readonly string[]): Promise<LocationCounts[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ locationId: t.locationMemberships.locationId, role: t.users.role, n: count() })
    .from(t.locationMemberships)
    .innerJoin(t.users, eq(t.users.id, t.locationMemberships.userId))
    .where(inArray(t.locationMemberships.locationId, [...ids]))
    .groupBy(t.locationMemberships.locationId, t.users.role);
  const byId = new Map<string, LocationCounts>(ids.map((id) => [id, { locationId: id, workers: 0, managers: 0 }]));
  for (const r of rows) {
    const c = byId.get(r.locationId)!;
    if (r.role === "WORKER") c.workers = r.n;
    if (r.role === "MANAGER") c.managers = r.n;
  }
  return [...byId.values()];
}

/** Feature flags are the super admin's lever on behaviour. */
export async function setLocationFeatureFlags(db: Db, actor: Actor, rawInput: unknown): Promise<Location> {
  requireSuperAdmin(actor);
  const input = SetLocationFeatureFlagsInputSchema.parse(rawInput);
  const [row] = await db
    .update(t.locations)
    .set({
      ...(input.selfCheckInEnabled != null ? { selfCheckInEnabled: input.selfCheckInEnabled } : {}),
      ...(input.managerMarkingEnabled != null ? { managerMarkingEnabled: input.managerMarkingEnabled } : {}),
      updatedAt: new Date(),
    })
    .where(eq(t.locations.id, input.locationId))
    .returning();
  if (!row) throw notFound("Location");
  return LocationSchema.parse(row);
}
