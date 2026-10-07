"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "urql";
import { AttendanceTable, type Entry } from "../components/AttendanceTable";
import { FilterChips } from "../components/FilterChips";
import { RequestAttendanceDialog } from "../components/RequestAttendanceDialog";
import { RoleGate, type Viewer } from "../components/RoleGate";
import { Button, ErrorText } from "../components/ui";
import type { AttendanceFilter } from "../gql/graphql";
import { AttendanceFeedDocument, CancelDocument, LocationDocument, OffBalanceDocument } from "../queries";

export function MyAttendancePage() {
  return <RoleGate allow={["WORKER"]}>{(viewer, locationId) => <WorkerAttendance viewer={viewer} locationId={locationId} />}</RoleGate>;
}

function WorkerAttendance({ viewer, locationId }: { viewer: Viewer; locationId: string }) {
  const [filter, setFilter] = useState<AttendanceFilter>("ALL");
  const [requesting, setRequesting] = useState(false);
  const [{ data: locData }] = useQuery({ query: LocationDocument, variables: { id: locationId } });
  const [{ data, error, fetching }, refetch] = useQuery({ query: AttendanceFeedDocument, variables: { locationId, filter } });
  const [{ data: balanceData }, refetchBalance] = useQuery({ query: OffBalanceDocument, variables: { locationId } });
  const [cancelState, cancel] = useMutation(CancelDocument);
  const [actionError, setActionError] = useState<string | null>(null);

  const feed = data?.attendanceFeed;
  const balance = balanceData?.offBalance;
  const location = locData?.location;
  const refresh = () => {
    refetch({ requestPolicy: "network-only" });
    refetchBalance({ requestPolicy: "network-only" });
  };

  async function onCancel(entry: Entry) {
    if (!entry.request) return;
    setActionError(null);
    const result = await cancel({ id: entry.request.id });
    if (result.error) setActionError(result.error.graphQLErrors[0]?.message ?? result.error.message);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">My attendance</h1>
          <p className="mt-1 text-sm text-muted">
            {viewer.name}
            {balance ? ` · OFF balance ${balance.remaining} of ${balance.allowance}` : ""}
            {feed ? ` · ${feed.counts.pending} pending` : ""}
          </p>
        </div>
        <Button onClick={() => setRequesting(true)}>
          <Plus className="h-4 w-4" /> Request attendance
        </Button>
      </div>

      <FilterChips value={filter} counts={feed?.counts} onChange={setFilter} />
      <ErrorText>{error?.message ?? actionError}</ErrorText>

      <div className={fetching && !data ? "opacity-50" : ""}>
        <AttendanceTable
          entries={feed?.entries ?? []}
          emptyMessage="No attendance yet. Submit a request to get started."
          renderActions={(entry) =>
            entry.request?.status === "PENDING" ? (
              <Button variant="danger" disabled={cancelState.fetching} onClick={() => onCancel(entry)}>Cancel request</Button>
            ) : null
          }
        />
      </div>
      <p className="text-xs text-muted">
        Each worker can have one record and one open request per date. <span className="mx-2">|</span> Sources: Manager · Integration · Worker request
      </p>

      {requesting && location ? (
        <RequestAttendanceDialog
          locationId={locationId}
          selfCheckInEnabled={location.selfCheckInEnabled}
          onClose={() => setRequesting(false)}
          onDone={() => { setRequesting(false); refresh(); }}
        />
      ) : null}
    </div>
  );
}
