import { z } from "zod";

/** Every entity id is a UUID. Parsing ids up front turns a malformed id into a VALIDATION error, not a database error. */
// `guid` rather than `uuid`: Postgres accepts any 8-4-4-4-12 hex id, not only RFC 4122 versions.
export const IdSchema = z.guid({ message: "Invalid id" });
