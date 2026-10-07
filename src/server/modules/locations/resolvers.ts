import type { Resolvers } from "../../graphql/__generated__/resolvers-types";
import { getLocation, listLocations, setLocationFeatureFlags } from "./service";

export const locationsResolvers: Resolvers = {
  Query: {
    locations: (_p, _a, ctx) => listLocations(ctx.db, ctx.actor),
    location: (_p, args, ctx) => getLocation(ctx.db, ctx.actor, args.id),
  },
  Mutation: {
    setLocationFeatureFlags: (_p, args, ctx) => setLocationFeatureFlags(ctx.db, ctx.actor, args.input),
  },
  Location: {
    workerCount: async (loc, _a, ctx) => (await ctx.loaders.locationCounts.load(loc.id)).workers,
    managerCount: async (loc, _a, ctx) => (await ctx.loaders.locationCounts.load(loc.id)).managers,
  },
};
