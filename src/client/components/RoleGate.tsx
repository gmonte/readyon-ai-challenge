"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useQuery } from "urql";
import { homeFor } from "../format";
import type { Role } from "../gql/graphql";
import { useLocationParam, withLocation } from "../location";
import { MeDocument } from "../queries";
import type { MeQuery } from "../gql/graphql";

export type Viewer = NonNullable<MeQuery["me"]>;

/** Pages render only for the roles they are for. Everyone else is sent to their own home. */
export function RoleGate({ allow, children }: { allow: Role[]; children: (viewer: Viewer, locationId: string) => ReactNode }) {
  const [{ data, fetching }] = useQuery({ query: MeDocument });
  const { locationId } = useLocationParam();
  const router = useRouter();
  const me = data?.me ?? null;
  const allowed = me ? allow.includes(me.role) : false;

  useEffect(() => {
    if (me && !allowed) router.replace(withLocation(homeFor(me.role), locationId));
  }, [me, allowed, router, locationId]);

  if (fetching) return <PageSkeleton />;
  if (!me) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <h1 className="text-xl font-semibold">Pick who you are viewing as</h1>
        <p className="mt-2 text-sm text-muted">Authentication is simulated. Use the “Viewing as” switcher in the header.</p>
      </div>
    );
  }
  if (!allowed) return <PageSkeleton />;
  if (!locationId) return <PageSkeleton />;
  return <>{children(me, locationId)}</>;
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true">
      <div className="h-10 w-64 rounded-lg bg-white" />
      <div className="h-10 w-96 rounded-full bg-white" />
      <div className="h-64 rounded-2xl bg-white" />
    </div>
  );
}
