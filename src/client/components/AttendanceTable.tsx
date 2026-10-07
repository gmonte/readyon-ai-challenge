"use client";

import type { ReactNode } from "react";
import { REQUEST_STATUS_LABEL, SOURCE_LABEL, formatDayLabel, formatShortDate, formatTime } from "../format";
import type { AttendanceEntryFieldsFragment } from "../gql/graphql";
import { Avatar, EmptyState, Pill, StatePill } from "./ui";

export type Entry = AttendanceEntryFieldsFragment;

export function AttendanceTable({
  entries,
  renderActions,
  emptyMessage = "Nothing here yet.",
}: {
  entries: Entry[];
  renderActions?: (entry: Entry) => ReactNode;
  emptyMessage?: string;
}) {
  const hasActions = Boolean(renderActions);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#f9faff] text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-6 py-3 font-semibold">Worker</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">Request</th>
            {hasActions ? <th className="px-6 py-3 text-right font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={hasActions ? 6 : 5}>
                <EmptyState>{emptyMessage}</EmptyState>
              </td>
            </tr>
          ) : (
            entries.map((entry) => <EntryRow key={entry.id} entry={entry} actions={renderActions?.(entry)} hasActions={hasActions} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function EntryRow({ entry, actions, hasActions }: { entry: Entry; actions: ReactNode; hasActions: boolean }) {
  const pending = entry.request?.status === "PENDING";
  const day = formatDayLabel(entry.date);
  const checkIn = formatTime(entry.record?.checkInAt);
  const checkOut = formatTime(entry.record?.checkOutAt);
  return (
    <tr data-testid="attendance-row" className={`border-t border-line ${pending ? "bg-pending-row" : ""}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={entry.worker.name} />
          <div>
            <div className="font-semibold">{entry.worker.name}</div>
            <div className="text-xs text-muted">
              {[entry.worker.externalId, entry.jobTitle].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="font-semibold">{day.main}</div>
        <div className="text-xs text-muted">{day.year}</div>
      </td>
      <td className="px-4 py-4">
        <StatePill state={entry.state} />
        {checkIn ? (
          <div className="mt-1 text-xs text-muted">
            {checkIn}
            {checkOut ? ` – ${checkOut}` : ""}
          </div>
        ) : null}
      </td>
      <td className="px-4 py-4 text-ink">{entry.source ? SOURCE_LABEL[entry.source] : <span className="text-muted">— (on approval)</span>}</td>
      <td className="px-4 py-4">
        <RequestCell entry={entry} />
      </td>
      {hasActions ? <td className="px-6 py-4 text-right">{actions}</td> : null}
    </tr>
  );
}

function RequestCell({ entry }: { entry: Entry }) {
  const r = entry.request;
  if (!r) return <span className="text-muted">—</span>;
  const tone = r.status === "PENDING" ? "pending" : r.status === "APPROVED" ? "approved" : "neutral";
  const decided = r.reviewedAt && r.reviewedBy && r.status !== "PENDING";
  return (
    <div className="space-y-1">
      <Pill tone={tone}>{REQUEST_STATUS_LABEL[r.status]}</Pill>
      {decided ? (
        <div className="text-xs text-muted">
          {REQUEST_STATUS_LABEL[r.status]} by {r.reviewedBy!.name} · {formatShortDate(r.reviewedAt!)}
        </div>
      ) : r.note ? (
        <div className="text-xs text-muted">{r.note}</div>
      ) : null}
    </div>
  );
}
