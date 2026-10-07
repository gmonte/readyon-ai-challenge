import { createYoga } from "graphql-yoga";
import type { Db } from "../db/types";
import { createContext, type GraphQLContext } from "./context";
import { maskError } from "./errors";
import { schema } from "./schema";

/** The gateway. `db` is injected so tests can run it on PGlite. */
export function createGateway(db: Db) {
  return createYoga<object, GraphQLContext>({
    schema,
    graphqlEndpoint: "/api/graphql",
    context: ({ request }) => createContext(db, request),
    maskedErrors: { maskError },
    fetchAPI: { Response },
    graphiql: process.env.NODE_ENV !== "production",
  });
}
