import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: ["src/server/graphql/root.graphql", "src/server/modules/**/schema.graphql"],
  documents: ["src/client/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "!src/client/gql/**"],
  ignoreNoDocuments: true,
  generates: {
    "src/server/graphql/__generated__/resolvers-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "../context#GraphQLContext",
        useIndexSignature: true,
        mapperTypeSuffix: "Model",
        scalars: {
          Date: "string",
          DateTime: { input: "Date", output: "Date | string" },
        },
        mappers: {
          User: "../../modules/identity/schemas#User",
          Membership: "../../modules/identity/schemas#Membership",
          Location: "../../modules/locations/schemas#Location",
          AttendanceRecord: "../../modules/attendance/schemas#AttendanceRecord",
          AttendanceRequest: "../../modules/attendance/schemas#AttendanceRequest",
          AttendanceEntry: "../../modules/attendance/schemas#AttendanceEntry",
        },
      },
    },
    "src/client/gql/": {
      preset: "client",
      config: {
        scalars: { Date: "string", DateTime: "string" },
      },
      presetConfig: { fragmentMasking: false },
    },
  },
};

export default config;
