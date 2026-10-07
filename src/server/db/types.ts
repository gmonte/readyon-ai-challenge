import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

type Schema = typeof schema;

/** Any Drizzle Postgres database or transaction, so services run on postgres-js in prod and PGlite in tests. */
export type Db =
  | PgDatabase<PgQueryResultHKT, Schema>
  | PgTransaction<PgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;
