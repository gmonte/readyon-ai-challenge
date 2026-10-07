import { forbidden, unauthenticated } from "../errors";
import type { Actor, UserActor } from "./actor";

/** Authorization rules in one place. Every rule is scoped to a location, as the spec requires. */

export function requireUser(actor: Actor): UserActor {
  if (actor.kind !== "user") throw unauthenticated();
  return actor;
}

export function isSuperAdmin(actor: Actor): boolean {
  return actor.kind === "user" && actor.user.role === "SUPER_ADMIN";
}

export function isMemberOf(actor: UserActor, locationId: string): boolean {
  return actor.locationIds.includes(locationId);
}

/** Workers, managers and admins may *see* a location they belong to. Admins see all. */
export function requireLocationAccess(actor: Actor, locationId: string): UserActor {
  const user = requireUser(actor);
  if (isSuperAdmin(user) || isMemberOf(user, locationId)) return user;
  throw forbidden("You do not belong to this location");
}

/** Only a manager of the location (or a super admin) may run its operational workflows. */
export function requireManagerOf(actor: Actor, locationId: string): UserActor {
  const user = requireUser(actor);
  if (isSuperAdmin(user)) return user;
  if (user.user.role === "MANAGER" && isMemberOf(user, locationId)) return user;
  throw forbidden("Only managers of this location can do that");
}

/** Only a worker who belongs to the location may ask for attendance there. */
export function requireWorkerAt(actor: Actor, locationId: string): UserActor {
  const user = requireUser(actor);
  if (user.user.role !== "WORKER") throw forbidden("Only workers submit attendance requests");
  if (!isMemberOf(user, locationId)) throw forbidden("You do not belong to this location");
  return user;
}

export function requireSuperAdmin(actor: Actor): UserActor {
  const user = requireUser(actor);
  if (!isSuperAdmin(user)) throw forbidden("Only super admins can do that");
  return user;
}

export function requireIntegration(actor: Actor): void {
  if (actor.kind !== "integration") throw forbidden("Integration API key required");
}
