import { useEffect, useRef, useState } from "react";

import { distanceMeters } from "@/lib/geo/haversine";
import {
  PRELOAD_RADIUS_M,
  preloadTerrainAround,
  type PreloadProgress,
} from "@/lib/terrain/preload";
import type { Coordinates } from "@/types/geo";

import type { UserLocationState } from "./useUserLocation";

/**
 * How far you must move before the surrounding terrain is fetched again.
 *
 * Generous because the preload covers ten miles: re-fetching after a few
 * hundred metres would re-request tiles already held. A GPS watch also
 * emits a new fix roughly every second while you stand still, and without
 * a gate like this every one of those would look like movement.
 */
const REFRESH_AFTER_M = 3_000;

export interface TerrainPreloadState extends PreloadProgress {
  isLoading: boolean;
  /** Centre the current cache was built around. */
  centre: Coordinates | null;
}

/**
 * Fetches the terrain around you once a position is known, so that tapping
 * to identify reads memory instead of waiting on the network.
 */
export function useTerrainPreload(
  location: UserLocationState
): TerrainPreloadState {
  const [state, setState] = useState<TerrainPreloadState>({
    loaded: 0,
    total: 0,
    isLoading: false,
    centre: null,
  });

  const centreRef = useRef<Coordinates | null>(null);
  const latitude = location.coords?.latitude;
  const longitude = location.coords?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;

    const here: Coordinates = { latitude, longitude };
    const previous = centreRef.current;
    if (previous && distanceMeters(previous, here) < REFRESH_AFTER_M) {
      return;
    }

    centreRef.current = here;
    const signal = { cancelled: false };

    setState((current) => ({ ...current, isLoading: true, centre: here }));

    preloadTerrainAround(here, {
      radiusMeters: PRELOAD_RADIUS_M,
      signal,
      onProgress: (progress) => {
        if (signal.cancelled) return;
        setState({ ...progress, isLoading: true, centre: here });
      },
    })
      .then((progress) => {
        if (signal.cancelled) return;
        setState({ ...progress, isLoading: false, centre: here });
      })
      .catch(() => {
        if (signal.cancelled) return;
        setState((current) => ({ ...current, isLoading: false }));
      });

    return () => {
      signal.cancelled = true;
    };
  }, [latitude, longitude]);

  return state;
}
