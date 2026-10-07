"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "urql";
import { AttendanceTable, type Entry } from "../components/AttendanceTable";
import { FilterChips } from "../components/FilterChips";
import { MarkAttendanceDialog } from "../components/MarkAttendanceDialog";
import { RoleGate } from "../components/RoleGate";
import { Button, ErrorText } from "../components/ui";
import type { AttendanceFilter } from "../gql/graphql";
import { ApproveDocument, AttendanceFeedDocument, LocationDocument, RejectDocument } from "../queries";

export function AttendancePage() {
  return <RoleGate allow={["MANAGER", "SUPER_ADMIN"]}>{(_viewer, locationId) => <ManagerAttendance locationId={locationId} />}</RoleGate>;
}

function ManagerAttendance({ locationId }: { locationId: string }) {
  const [filter, setFilter] = useState<AttendanceFilter>("ALL");
  const [marking, setMarking] = useState(false);
  const [{ data: locData }] = useQuery({ query: LocationDocument, variables: { id: locationId } });
  const [{ data, error, fetching }, refetch] = useQuery({ query: AttendanceFeedDocument, variables: { locationId, filter } });
  const [approveState, approve] = useMutation(ApproveDocument);
  const [rejectState, reject] = useMutation(RejectDocument);
  const [actionError, setActionError] = useState<string | null>(null);

  const feed = data?.attendanceFeed;
  const location = locData?.location;
  const refresh = () => refetch({ requestPolicy: "network-only" });

  async function decide(entry: Entry, action: "approve" | "reject") {
    if (!entry.request) return;
    setActionError(null);
    const result = action === "approve" ? await approve({ id: entry.request.id }) : await reject({ id: entry.request.id });
    if (result.error) setActionError(result.error.graphQLErrors[0]?.message ?? result.error.message);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-muted">
            {feed ? `${feed.counts.pending} pending approval` : "…"}
            {location ? ` · ${location.name}` : ""}
          </p>
        </div>
        <Button onClick={() => setMarking(true)} disabled={!location || !location.managerMarkingEnabled} title={location && !location.managerMarkingEnabled ? "Manager attendance marking is disabled at this location" : undefined}>
          <Plus className="h-4 w-4" /> Mark attendance
        </Button>
      </div>
      {location && !location.managerMarkingEnabled ? (
        <p className="text-sm text-muted">Manager attendance marking is disabled at {location.name}. You can still approve or reject requests.</p>
      ) : null}

      <FilterChips value={filter} counts={feed?.counts} onChange={setFilter} />
      <ErrorText>{error?.message ?? actionError}</ErrorText>

      <div className={fetching && !data ? "opacity-50" : ""}>
        <AttendanceTable
          entries={feed?.entries ?? []}
          emptyMessage="No attendance or requests match this filter."
          renderActions={(entry) =>
            entry.request?.status === "PENDING" ? (
              <div className="flex justify-end gap-2">
                <Button variant="danger" disabled={rejectState.fetching || approveState.fetching} onClick={() => decide(entry, "reject")}>Reject</Button>
                <Button disabled={rejectState.fetching || approveState.fetching} onClick={() => decide(entry, "approve")}>Approve</Button>
              </div>
            ) : entry.request?.status === "APPROVED" ? (
              <span className="text-sm text-muted">Approved</span>
            ) : null
          }
        />
      </div>

      {marking ? <MarkAttendanceDialog locationId={locationId} onClose={() => setMarking(false)} onDone={() => { setMarking(false); refresh(); }} /> : null}
    </div>
  );
}
