import type { Actor } from "../auth/actor";
import * as t from "../db/schema";
import type { Db } from "../db/types";
import type { Role } from "../modules/identity/schemas";
import { loadActorForUser } from "../modules/identity/service";

export async function createLocation(db: Db, overrides: Partial<typeof t.locations.$inferInsert> = {}) {
  const [row] = await db
    .insert(t.locations)
    .values({ name: "Test Location", address: "1 Test St", ...overrides })
    .returning();
  return row!;
}

export async function createUser(
  db: Db,
  role: Role,
  overrides: Partial<typeof t.users.$inferInsert> = {},
) {
  const [row] = await db
    .insert(t.users)
    .values({ name: `${role} ${Math.random().toString(36).slice(2, 6)}`, role, ...overrides })
    .returning();
  return row!;
}

export async function addMembership(db: Db, userId: string, locationId: string, jobTitle: string | null = null) {
  const [row] = await db.insert(t.locationMemberships).values({ userId, locationId, jobTitle }).returning();
  return row!;
}

export async function actorFor(db: Db, userId: string): Promise<Actor> {
  return loadActorForUser(db, userId);
}

export const integrationActor: Actor = { kind: "integration" };
export const anonymousActor: Actor = { kind: "anonymous" };

/** A location with one worker and one manager, ready for attendance scenarios. */
export async function seedScenario(db: Db, location: Partial<typeof t.locations.$inferInsert> = {}) {
  const loc = await createLocation(db, location);
  const worker = await createUser(db, "WORKER", { name: "Tom Reyes", externalId: `RO-${Math.floor(Math.random() * 1e6)}`, isPersona: true });
  const manager = await createUser(db, "MANAGER", { name: "Megan Garcia", isPersona: true });
  await addMembership(db, worker.id, loc.id, "Food server");
  await addMembership(db, manager.id, loc.id);
  return {
    location: loc,
    worker,
    manager,
    workerActor: await actorFor(db, worker.id),
    managerActor: await actorFor(db, manager.id),
  };
}
