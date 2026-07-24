import { createContext, useContext, useMemo } from "react";

import { useCompassHeading } from "@/hooks/useCompassHeading";
import { useDevicePitch } from "@/hooks/useDevicePitch";
import { useUserLocation, type UserLocationState } from "@/hooks/useUserLocation";

interface ARStateContextValue {
  location: UserLocationState;
  headingDeg: number;
  pitchDeg: number;
}

const ARStateContext = createContext<ARStateContextValue | null>(null);

/**
 * Subscribes to GPS, compass, and motion sensors exactly once and shares
 * the results with the whole AR viewer subtree, so BeamOverlay doesn't
 * spin up a redundant sensor subscription per pin.
 */
export function ARStateProvider({ children }: { children: React.ReactNode }) {
  const location = useUserLocation();
  const headingDeg = useCompassHeading();
  const pitchDeg = useDevicePitch();

  const value = useMemo(
    () => ({ location, headingDeg, pitchDeg }),
    [location, headingDeg, pitchDeg]
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
