"use client";

import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { useQuery } from "urql";
import { switchPersona } from "../auth/actions";
import { ROLE_LABEL, homeFor } from "../format";
import type { Role } from "../gql/graphql";
import { useLocationParam, withLocation } from "../location";
import { MeDocument, NavLocationsDocument, PendingCountDocument, PersonasDocument } from "../queries";
import { Avatar } from "./ui";

const ROLES: Role[] = ["WORKER", "MANAGER", "SUPER_ADMIN"];

export function AppHeader() {
  const pathname = usePathname();
  const [{ data: meData }] = useQuery({ query: MeDocument });
  const [{ data: personasData }] = useQuery({ query: PersonasDocument });
  const me = meData?.me ?? null;
  const [{ data: locationsData }] = useQuery({ query: NavLocationsDocument, pause: !me });
  const locations = useMemo(() => locationsData?.locations ?? [], [locationsData]);
  const { locationId, setLocationId } = useLocationParam();
  const [, startTransition] = useTransition();

  // Default to the first visible location when the URL has none.
  const firstLocationId = locations[0]?.id;
  useEffect(() => {
    if (!locationId && firstLocationId) setLocationId(firstLocationId);
  }, [locationId, firstLocationId, setLocationId]);

  const currentLocation = locations.find((l) => l.id === locationId) ?? locations[0];
  const canSeePending = me?.role === "MANAGER" || me?.role === "SUPER_ADMIN";
  const [{ data: pendingData }] = useQuery({
    query: PendingCountDocument,
    variables: { locationId: currentLocation?.id ?? "" },
    pause: !canSeePending || !currentLocation,
  });
  const pending = pendingData?.pendingRequestCount ?? 0;

  const tabs =
    me?.role === "WORKER"
      ? [{ href: "/my-attendance", label: "My attendance" }]
      : me?.role === "MANAGER"
        ? [{ href: "/attendance", label: "Attendance", badge: pending }]
        : me?.role === "SUPER_ADMIN"
          ? [
              { href: "/attendance", label: "Attendance", badge: pending },
              { href: "/locations", label: "Locations" },
            ]
          : [];

  function onSwitch(role: Role) {
    const persona = personasData?.personas.find((p) => p.role === role);
    if (!persona || persona.id === me?.id) return;
    startTransition(async () => {
      await switchPersona(persona.id);
      // Full reload: the simulated session changed, so every cached query is stale.
      window.location.assign(homeFor(role));
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-emerald-400 text-sm font-black text-white">R</span>
          <div className="hidden border-l border-line pl-3 sm:block">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">Future Enterprises</div>
            <div className="relative">
              <select
                aria-label="Location"
                value={currentLocation?.id ?? ""}
                onChange={(e) => setLocationId(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-lg font-bold leading-tight outline-none"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1.5 h-4 w-4 text-muted" />
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={withLocation(t.href, currentLocation?.id ?? null)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"}`}
              >
                {t.label}
                {t.badge ? <span className="rounded-full bg-pending px-1.5 text-[11px] font-bold text-white">{t.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-muted lg:block">Viewing as</span>
          <div className="flex rounded-full bg-canvas p-1" role="group" aria-label="Viewing as">
            {ROLES.map((role) => {
              const active = me?.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onSwitch(role)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
                >
                  {ROLE_LABEL[role]}
                </button>
              );
            })}
          </div>
          <button type="button" aria-label="Notifications" className="relative hidden rounded-full p-2 text-ink hover:bg-canvas sm:block">
            <Bell className="h-5 w-5" />
            {pending > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pending" /> : null}
          </button>
          {me ? <Avatar name={me.name} /> : <span className="h-10 w-10 rounded-full bg-canvas" />}
        </div>
      </div>
    </header>
  );
}
