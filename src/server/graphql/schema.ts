import { createSchema } from "graphql-yoga";
import { readFileSync } from "node:fs";
import path from "node:path";
import { attendanceResolvers } from "../modules/attendance/resolvers";
import { identityResolvers } from "../modules/identity/resolvers";
import { locationsResolvers } from "../modules/locations/resolvers";
import type { Resolvers } from "./__generated__/resolvers-types";
import type { GraphQLContext } from "./context";
import { DateScalar, DateTimeScalar } from "./scalars";

/**
 * Each module owns its SDL and resolvers; the gateway only stitches them together.
 * Paths are literal so the bundler traces exactly these four files into the server output.
 */
export const typeDefs = [
  readFileSync(path.join(process.cwd(), "src/server/graphql/root.graphql"), "utf8"),
  readFileSync(path.join(process.cwd(), "src/server/modules/identity/schema.graphql"), "utf8"),
  readFileSync(path.join(process.cwd(), "src/server/modules/locations/schema.graphql"), "utf8"),
  readFileSync(path.join(process.cwd(), "src/server/modules/attendance/schema.graphql"), "utf8"),
];

const rootResolvers: Resolvers = {
  Date: DateScalar,
  DateTime: DateTimeScalar,
  Query: { _health: () => "ok" },
  Mutation: { _noop: () => null },
};

export const schema = createSchema<GraphQLContext>({
  typeDefs,
  resolvers: [rootResolvers, identityResolvers, locationsResolvers, attendanceResolvers],
});
