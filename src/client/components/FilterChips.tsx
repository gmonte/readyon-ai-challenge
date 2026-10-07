"use client";

import type { AttendanceFilter } from "../gql/graphql";

const FILTERS: Array<{ key: AttendanceFilter; label: string; count: "all" | "pending" | "present" | "off" }> = [
  { key: "ALL", label: "All", count: "all" },
  { key: "PENDING", label: "Pending", count: "pending" },
  { key: "PRESENT", label: "Present", count: "present" },
  { key: "OFF", label: "Off", count: "off" },
];

export function FilterChips({
  value,
  counts,
  onChange,
}: {
  value: AttendanceFilter;
  counts: { all: number; pending: number; present: number; off: number } | undefined;
  onChange: (f: AttendanceFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter attendance">
      {FILTERS.map((f) => {
        const active = f.key === value;
        return (
          <button
            key={f.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:bg-canvas"
            }`}
          >
            {f.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20" : "bg-canvas text-muted"}`}>{counts?.[f.count] ?? "–"}</span>
          </button>
        );
      })}
    </div>
  );
}
