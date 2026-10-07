"use client";

import { Client, Provider, cacheExchange, fetchExchange } from "urql";
import { useState, type ReactNode } from "react";

/** The frontend's only data path: the GraphQL gateway at /api/graphql (ADR 0002). */
export function UrqlProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new Client({
        url: "/api/graphql",
        exchanges: [cacheExchange, fetchExchange],
        fetchOptions: { credentials: "same-origin" },
      }),
  );
  return <Provider value={client}>{children}</Provider>;
}
