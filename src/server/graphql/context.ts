import DataLoader from "dataloader";
import type { Actor } from "../auth/actor";
import type { Db } from "../db/types";
import type { Membership, User } from "../modules/identity/schemas";
import { getMembershipsForUsers, getUsersByIds, loadActorForUser } from "../modules/identity/service";
import type { Location } from "../modules/locations/schemas";
import { getLocationCounts, getLocationsByIds, type LocationCounts } from "../modules/locations/service";

export const AUTH_COOKIE = "readyon_user";
export const API_KEY_HEADER = "x-api-key";

export type Loaders = {
  userById: DataLoader<string, User | null>;
  locationById: DataLoader<string, Location | null>;
  membershipsByUserId: DataLoader<string, Membership[]>;
  locationCounts: DataLoader<string, LocationCounts>;
};

export type GraphQLContext = {
  db: Db;
  actor: Actor;
  loaders: Loaders;
};

export function createLoaders(db: Db): Loaders {
  return {
    userById: new DataLoader(async (ids) => {
      const users = await getUsersByIds(db, ids);
      const byId = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
    locationById: new DataLoader(async (ids) => {
      const locations = await getLocationsByIds(db, ids);
      const byId = new Map(locations.map((l) => [l.id, l]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
    membershipsByUserId: new DataLoader(async (ids) => {
      const memberships = await getMembershipsForUsers(db, ids);
      return ids.map((id) => memberships.filter((m) => m.userId === id));
    }),
    locationCounts: new DataLoader(async (ids) => {
      const counts = await getLocationCounts(db, ids);
      const byId = new Map(counts.map((c) => [c.locationId, c]));
      return ids.map((id) => byId.get(id) ?? { locationId: id, workers: 0, managers: 0 });
    }),
  };
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Simulated authentication: a user-id cookie set by the "Viewing as" switcher, or an integration API key. */
export async function resolveActor(db: Db, request: Request): Promise<Actor> {
  const apiKey = request.headers.get(API_KEY_HEADER);
  const expected = process.env.INTEGRATION_API_KEY ?? "dev-integration-key";
  if (apiKey && apiKey === expected) return { kind: "integration" };
  return loadActorForUser(db, readCookie(request.headers.get("cookie"), AUTH_COOKIE));
}

export async function createContext(db: Db, request: Request): Promise<GraphQLContext> {
  return { db, actor: await resolveActor(db, request), loaders: createLoaders(db) };
}

/** For tests and server-side callers that already know the actor. */
export function createContextForActor(db: Db, actor: Actor): GraphQLContext {
  return { db, actor, loaders: createLoaders(db) };
}
