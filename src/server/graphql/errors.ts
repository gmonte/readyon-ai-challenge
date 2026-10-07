import { GraphQLError } from "graphql";
import { ZodError } from "zod";
import { DomainError } from "../errors";

type LocatedError = Error & {
  originalError?: unknown;
  cause?: unknown;
  nodes?: GraphQLError["nodes"];
  path?: GraphQLError["path"];
};

/**
 * Yoga calls this for every error that reaches the response. Services throw DomainError and Zod errors;
 * this is the one place they become GraphQL errors with a stable `extensions.code`.
 *
 * The wrapper is duck-typed rather than `instanceof GraphQLError`: bundlers and test runners can load two
 * copies of `graphql`, and the executor's located error may come from the other one.
 */
export function maskError(error: unknown, message: string, isDev?: boolean): Error {
  const located = (error && typeof error === "object" ? error : {}) as LocatedError;
  const original: unknown = located.originalError ?? located.cause ?? error;
  const where = { nodes: located.nodes, path: located.path };

  // Expected errors are rewritten in place when possible: Yoga logs every error it has to *replace*,
  // and a worker being told "you can't do that" is not worth a stack trace in the server log.
  if (original instanceof DomainError) {
    return expected(located, original.message, { code: original.code }, where);
  }
  if (original instanceof ZodError) {
    const first = original.issues[0];
    const prefix = first?.path.length ? `${first.path.join(".")}: ` : "";
    return expected(
      located,
      `${prefix}${first?.message ?? "Invalid input"}`,
      { code: "VALIDATION", issues: original.issues },
      where,
    );
  }
  // Syntax, validation and scalar-coercion errors raised by graphql itself wrap nothing: pass through.
  if (original === error && error instanceof Error && located.nodes !== undefined) return error;

  console.error(original);
  return new GraphQLError(isDev && original instanceof Error ? original.message : message, {
    ...where,
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}

function expected(
  located: LocatedError,
  message: string,
  extensions: Record<string, unknown>,
  where: { nodes: GraphQLError["nodes"]; path: GraphQLError["path"] },
): Error {
  const target = located as LocatedError & { extensions?: Record<string, unknown> };
  if (target instanceof Error && target.extensions && typeof target.extensions === "object") {
    target.message = message;
    Object.assign(target.extensions, extensions);
    return target;
  }
  return new GraphQLError(message, { ...where, extensions });
}
