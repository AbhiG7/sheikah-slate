import { createContext, useContext, useMemo } from "react";

import {
  useOrientationValues,
  type OrientationValues,
} from "@/hooks/useOrientationValues";
import {
  useTerrainPreload,
  type TerrainPreloadState,
} from "@/hooks/useTerrainPreload";
import { useUserLocation, type UserLocationState } from "@/hooks/useUserLocation";

interface ARStateContextValue {
  /** Changes rarely, so it is ordinary React state. */
  location: UserLocationState;
  /**
   * Changes at sensor rate, so it is deliberately NOT React state. Reading
   * these in a component body gives a stale value and will not re-render
   * when they change; use them in an animated style, or call `read()` for a
   * one-shot JS value.
   */
  orientation: OrientationValues;
  /** Progress warming the terrain cache around you. */
  preload: TerrainPreloadState;
}

const ARStateContext = createContext<ARStateContextValue | null>(null);

/**
 * Subscribes to GPS and orientation exactly once for the whole AR subtree.
 *
 * The context value only changes when the GPS fix changes, so panning the
 * phone re-renders nothing at all.
 */
export function ARStateProvider({ children }: { children: React.ReactNode }) {
  const location = useUserLocation();
  const orientation = useOrientationValues();
  // Warms the tile cache so a tap reads memory instead of the network.
  const preload = useTerrainPreload(location);

  const value = useMemo(
    () => ({ location, orientation, preload }),
    [location, orientation, preload]
  );

  return <ARStateContext.Provider value={value}>{children}</ARStateContext.Provider>;
}

export function useARState(): ARStateContextValue {
  const ctx = useContext(ARStateContext);
  if (!ctx) {
    throw new Error("useARState must be used within an ARStateProvider");
  }
  return ctx;
}
