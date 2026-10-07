import type { Resolvers } from "../../graphql/__generated__/resolvers-types";
import type { GraphQLContext } from "../../graphql/context";
import {
  approveAttendanceRequest,
  cancelAttendanceRequest,
  countPendingRequests,
  getAttendanceFeed,
  getOffBalance,
  getRequestById,
  markAttendance,
  recordIntegrationAttendance,
  rejectAttendanceRequest,
  submitAttendanceRequest,
} from "./service";

async function loadUser(ctx: GraphQLContext, id: string) {
  const user = await ctx.loaders.userById.load(id);
  if (!user) throw new Error(`User ${id} not found`);
  return user;
}
async function loadLocation(ctx: GraphQLContext, id: string) {
  const location = await ctx.loaders.locationById.load(id);
  if (!location) throw new Error(`Location ${id} not found`);
  return location;
}

export const attendanceResolvers: Resolvers = {
  Query: {
    attendanceFeed: (_p, args, ctx) =>
      getAttendanceFeed(ctx.db, ctx.actor, { locationId: args.locationId, filter: args.filter ?? "ALL" }),
    pendingRequestCount: (_p, args, ctx) => countPendingRequests(ctx.db, ctx.actor, args.locationId),
    offBalance: (_p, args, ctx) =>
      getOffBalance(ctx.db, ctx.actor, {
        locationId: args.locationId,
        workerId: args.workerId ?? undefined,
        year: args.year ?? undefined,
      }),
  },
  Mutation: {
    submitAttendanceRequest: (_p, args, ctx) => submitAttendanceRequest(ctx.db, ctx.actor, args.input),
    cancelAttendanceRequest: (_p, args, ctx) => cancelAttendanceRequest(ctx.db, ctx.actor, args.id),
    approveAttendanceRequest: (_p, args, ctx) => approveAttendanceRequest(ctx.db, ctx.actor, args.id),
    rejectAttendanceRequest: (_p, args, ctx) => rejectAttendanceRequest(ctx.db, ctx.actor, args.id),
    markAttendance: (_p, args, ctx) => markAttendance(ctx.db, ctx.actor, args.input),
    recordIntegrationAttendance: (_p, args, ctx) => recordIntegrationAttendance(ctx.db, ctx.actor, args.input),
  },
  AttendanceEntry: {
    location: (e, _a, ctx) => loadLocation(ctx, e.locationId),
  },
  AttendanceRecord: {
    worker: (r, _a, ctx) => loadUser(ctx, r.workerId),
    location: (r, _a, ctx) => loadLocation(ctx, r.locationId),
    markedBy: (r, _a, ctx) => (r.markedById ? ctx.loaders.userById.load(r.markedById) : null),
    request: (r, _a, ctx) => (r.requestId ? getRequestById(ctx.db, r.requestId) : null),
  },
  AttendanceRequest: {
    worker: (r, _a, ctx) => loadUser(ctx, r.workerId),
    location: (r, _a, ctx) => loadLocation(ctx, r.locationId),
    reviewedBy: (r, _a, ctx) => (r.reviewedById ? ctx.loaders.userById.load(r.reviewedById) : null),
  },
};
