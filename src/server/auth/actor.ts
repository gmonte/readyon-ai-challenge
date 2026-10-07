import type { Role } from "../modules/identity/schemas";

export type UserActor = {
  kind: "user";
  user: { id: string; name: string; role: Role; externalId: string | null };
  /** Location ids this user is a member of (worker or manager). */
  locationIds: string[];
};

/** A third-party system authenticated by API key. Identifies workers by external identifier. */
export type IntegrationActor = { kind: "integration" };

export type AnonymousActor = { kind: "anonymous" };

export type Actor = UserActor | IntegrationActor | AnonymousActor;
