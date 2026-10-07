export type DomainErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION";

/** Thrown by services. The GraphQL layer maps it to `extensions.code`; services never import graphql. */
export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const unauthenticated = (msg = "You must be signed in") => new DomainError("UNAUTHENTICATED", msg);
export const forbidden = (msg = "You are not allowed to do that") => new DomainError("FORBIDDEN", msg);
export const notFound = (what: string) => new DomainError("NOT_FOUND", `${what} not found`);
export const conflict = (msg: string) => new DomainError("CONFLICT", msg);
export const validation = (msg: string) => new DomainError("VALIDATION", msg);

/** Postgres unique_violation, as raised by postgres-js or PGlite. */
export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: { code?: string } };
  return e.code === "23505" || e.cause?.code === "23505";
}
