"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "urql";
import { RoleGate } from "../components/RoleGate";
import { ErrorText, Pill, Toggle } from "../components/ui";
import { useLocationParam } from "../location";
import { LocationsPageDocument, SetFlagsDocument } from "../queries";

export function LocationsPage() {
  return <RoleGate allow={["SUPER_ADMIN"]}>{() => <LocationsAdmin />}</RoleGate>;
}

function LocationsAdmin() {
  const [{ data, error }, refetch] = useQuery({ query: LocationsPageDocument });
  const [{ fetching }, setFlags] = useMutation(SetFlagsDocument);
  const [actionError, setActionError] = useState<string | null>(null);
  const { locationId, setLocationId } = useLocationParam();

  async function toggle(id: string, flag: "selfCheckInEnabled" | "managerMarkingEnabled", value: boolean) {
    setActionError(null);
    const result = await setFlags({ input: { locationId: id, [flag]: value } });
    if (result.error) setActionError(result.error.graphQLErrors[0]?.message ?? result.error.message);
    refetch({ requestPolicy: "network-only" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Locations</h1>
          <p className="mt-1 text-sm text-muted">Feature flags and permissions are scoped per location</p>
        </div>
        <ErrorText>{error?.message ?? actionError}</ErrorText>
        <div className="space-y-4">
          {(data?.locations ?? []).map((loc) => {
            const selected = loc.id === locationId;
            return (
              <section
                key={loc.id}
                onClick={() => setLocationId(loc.id)}
                className={`cursor-pointer rounded-2xl border bg-white p-6 transition ${selected ? "border-primary ring-1 ring-primary" : "border-line"}`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Building2 className="h-7 w-7" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold">{loc.name}</h2>
                    <p className="text-sm text-muted">{loc.address}</p>
                  </div>
                  <dl className="flex gap-8 text-center">
                    <Stat label="Workers" value={loc.workerCount} />
                    <Stat label="Managers" value={loc.managerCount} />
                    <Stat label="Off / yr" value={loc.offDaysPerYear} />
                  </dl>
                </div>
                <div className="mt-6 divide-y divide-line border-t border-line">
                  <FlagRow
                    title="Self check-in"
                    description="Workers' check-in requests are approved immediately"
                    checked={loc.selfCheckInEnabled}
                    disabled={fetching}
                    onChange={(v) => toggle(loc.id, "selfCheckInEnabled", v)}
                  />
                  <FlagRow
                    title="Manager attendance marking"
                    description="Managers mark PRESENT / OFF directly"
                    checked={loc.managerMarkingEnabled}
                    disabled={fetching}
                    onChange={(v) => toggle(loc.id, "managerMarkingEnabled", v)}
                  />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold">Roles</h2>
        <p className="mt-1 text-sm text-muted">All ownership and permissions are scoped at the location level.</p>
        <dl className="mt-5 space-y-5 text-sm">
          <RoleRow tone="present" name="Worker">Views own records and submits attendance requests. Cannot edit attendance directly.</RoleRow>
          <RoleRow tone="pending" name="Manager">Marks attendance and approves requests — only for locations they manage.</RoleRow>
          <RoleRow tone="neutral" name="Super admin">Manages all locations, feature flags, roles and integrations across the company.</RoleRow>
        </dl>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="order-last text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-2xl font-bold">{value}</dd>
    </div>
  );
}

function FlagRow({ title, description, checked, disabled, onChange }: { title: string; description: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4" onClick={(e) => e.stopPropagation()}>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold ${checked ? "text-present" : "text-muted"}`}>{checked ? "Enabled" : "Disabled"}</span>
        <Toggle checked={checked} disabled={disabled} onChange={onChange} label={title} />
      </div>
    </div>
  );
}

function RoleRow({ tone, name, children }: { tone: "present" | "pending" | "neutral"; name: string; children: string }) {
  return (
    <div className="flex gap-3">
      <dt className="shrink-0"><Pill tone={tone}>{name}</Pill></dt>
      <dd className="text-muted">{children}</dd>
    </div>
  );
}
