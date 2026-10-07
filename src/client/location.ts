"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const LOCATION_PARAM = "location";

/** The current location lives in the URL so it is shareable and survives reloads. */
export function useLocationParam() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locationId = params.get(LOCATION_PARAM);

  const setLocationId = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params.toString());
      next.set(LOCATION_PARAM, id);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return { locationId, setLocationId };
}

export function withLocation(href: string, locationId: string | null): string {
  return locationId ? `${href}?${LOCATION_PARAM}=${encodeURIComponent(locationId)}` : href;
}
