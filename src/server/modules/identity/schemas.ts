import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ROLES, locationMemberships, users } from "../../db/schema";

export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = createSelectSchema(users);
export type User = z.infer<typeof UserSchema>;

export const MembershipSchema = createSelectSchema(locationMemberships);
export type Membership = z.infer<typeof MembershipSchema>;
