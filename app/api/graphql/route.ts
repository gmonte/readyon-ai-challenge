import { getDb } from "@/src/server/db/client";
import { createGateway } from "@/src/server/graphql/yoga";

const yoga = createGateway(getDb());

export const GET = yoga.handleRequest;
export const POST = yoga.handleRequest;
export const OPTIONS = yoga.handleRequest;
