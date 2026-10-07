"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "urql";
import { PageSkeleton } from "@/src/client/components/RoleGate";
import { homeFor } from "@/src/client/format";
import { MeDocument } from "@/src/client/queries";

/** Sends each persona to their home screen. With no persona yet, defaults to the worker's. */
export default function Home() {
  const [{ data, fetching }] = useQuery({ query: MeDocument });
  const router = useRouter();
  useEffect(() => {
    if (fetching) return;
    router.replace(data?.me ? homeFor(data.me.role) : "/my-attendance");
  }, [data, fetching, router]);
  return <PageSkeleton />;
}
