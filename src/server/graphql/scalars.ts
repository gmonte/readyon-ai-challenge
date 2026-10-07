import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { DateStringSchema } from "../modules/attendance/schemas";

/** YYYY-MM-DD, validated with the same Zod schema the services use. */
export const DateScalar = new GraphQLScalarType<string, string>({
  name: "Date",
  description: "Calendar date, YYYY-MM-DD.",
  serialize: (value) => String(value),
  parseValue: (value) => {
    const parsed = DateStringSchema.safeParse(value);
    if (!parsed.success) throw new GraphQLError("Date must be YYYY-MM-DD");
    return parsed.data;
  },
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.STRING) throw new GraphQLError("Date must be a string");
    const parsed = DateStringSchema.safeParse(ast.value);
    if (!parsed.success) throw new GraphQLError("Date must be YYYY-MM-DD");
    return parsed.data;
  },
});

export const DateTimeScalar = DateTimeResolver;
