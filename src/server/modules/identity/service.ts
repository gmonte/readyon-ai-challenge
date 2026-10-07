import { asc, eq, inArray } from "drizzle-orm";
import type { Actor, UserActor } from "../../auth/actor";
import { requireLocationAccess, requireUser } from "../../auth/policy";
import * as t from "../../db/schema";
import type { Db } from "../../db/types";
import { ROLES } from "../../db/schema";
import { IdSchema } from "../../schemas";
import { MembershipSchema, UserSchema, type Membership, type User } from "./schemas";

/** Build the request actor from the simulated-auth cookie value. Unknown ids become anonymous. */
export async function loadActorForUser(db: Db, userId: string | null | undefined): Promise<Actor> {
  if (!userId || !IdSchema.safeParse(userId).success) return { kind: "anonymous" };
  const [user] = await db.select().from(t.users).where(eq(t.users.id, userId)).limit(1);
  if (!user) return { kind: "anonymous" };
  const memberships = await db
    .select({ locationId: t.locationMemberships.locationId })
    .from(t.locationMemberships)
    .where(eq(t.locationMemberships.userId, user.id));
  return {
    kind: "user",
    user: { id: user.id, name: user.name, role: user.role, externalId: user.externalId },
    locationIds: memberships.map((m) => m.locationId),
  } satisfies UserActor;
}

export async function getUsersByIds(db: Db, ids: readonly string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const rows = await db.select().from(t.users).where(inArray(t.users.id, [...ids]));
  return rows.map((r) => UserSchema.parse(r));
}

export async function getMe(db: Db, actor: Actor): Promise<User | null> {
  if (actor.kind !== "user") return null;
  const [row] = await db.select().from(t.users).where(eq(t.users.id, actor.user.id)).limit(1);
  return row ? UserSchema.parse(row) : null;
}

/** The "Viewing as" switcher: one fixed user per role, the earliest seeded one. */
export async function listPersonas(db: Db): Promise<User[]> {
  const rows = await db.select().from(t.users).orderBy(asc(t.users.createdAt), asc(t.users.name));
  const byRole = new Map<string, User>();
  for (const row of rows) if (!byRole.has(row.role)) byRole.set(row.role, UserSchema.parse(row));
  return ROLES.flatMap((role) => byRole.get(role) ?? []);
}

export async function getMembershipsForUser(db: Db, userId: string): Promise<Membership[]> {
  const rows = await db.select().from(t.locationMemberships).where(eq(t.locationMemberships.userId, userId));
  return rows.map((r) => MembershipSchema.parse(r));
}

export async function getMembershipsForUsers(db: Db, userIds: readonly string[]): Promise<Membership[]> {
  if (userIds.length === 0) return [];
  const rows = await db
    .select()
    .from(t.locationMemberships)
    .where(inArray(t.locationMemberships.userId, [...userIds]));
  return rows.map((r) => MembershipSchema.parse(r));
}

/** Workers at a location with their job title, visible to anyone who belongs there. */
export async function listLocationWorkers(db: Db, actor: Actor, rawLocationId: string) {
  const locationId = IdSchema.parse(rawLocationId);
  requireLocationAccess(actor, locationId);
  const rows = await db
    .select({ user: t.users, jobTitle: t.locationMemberships.jobTitle })
    .from(t.locationMemberships)
    .innerJoin(t.users, eq(t.users.id, t.locationMemberships.userId))
    .where(eq(t.locationMemberships.locationId, locationId))
    .orderBy(asc(t.users.name));
  return rows
    .filter((r) => r.user.role === "WORKER")
    .map((r) => ({ user: UserSchema.parse(r.user), jobTitle: r.jobTitle }));
}

export function requireViewer(actor: Actor): UserActor {
  return requireUser(actor);
}
