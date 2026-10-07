import type { Resolvers } from "../../graphql/__generated__/resolvers-types";
import { getMe, listLocationWorkers, listPersonas } from "./service";

export const identityResolvers: Resolvers = {
  Query: {
    me: (_p, _a, ctx) => getMe(ctx.db, ctx.actor),
    personas: (_p, _a, ctx) => listPersonas(ctx.db),
    locationWorkers: (_p, args, ctx) => listLocationWorkers(ctx.db, ctx.actor, args.locationId),
  },
  User: {
    memberships: (user, _a, ctx) => ctx.loaders.membershipsByUserId.load(user.id),
  },
  Membership: {
    location: async (m, _a, ctx) => {
      const location = await ctx.loaders.locationById.load(m.locationId);
      if (!location) throw new Error(`Location ${m.locationId} missing for membership`);
      return location;
    },
  },
};
