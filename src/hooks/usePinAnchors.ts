import { useMemo } from "react";

import { MAX_RENDER_DISTANCE_M } from "@/lib/geo/constants";
import { distanceMeters, initialBearingDeg } from "@/lib/geo/haversine";
import type { Pin } from "@/types/pin";

import type { UserLocationState } from "./useUserLocation";

export interface PinAnchor {
  pin: Pin;
  /** Compass bearing from the user to the pin. */
  bearingDeg: number;
  distanceMeters: number;
  /** Pin elevation relative to the observer, metres. */
  altitudeDeltaM: number;
}

/**
 * The half of the beam maths that does not depend on where you are looking.
 *
 * Bearing and distance change only when the pin set or your GPS position
 * changes, which is rare, so they are computed here in React. Everything
 * that depends on heading and pitch is left to run per frame in a worklet.
 * Keeping that split is what allows panning to cost no React work at all.
 */
export function usePinAnchors(
  pins: Pin[],
  location: UserLocationState
): PinAnchor[] {
  const latitude = location.coords?.latitude;
  const longitude = location.coords?.longitude;
  const altitude = location.coords?.altitude ?? null;

  return useMemo(() => {
    if (latitude === undefined || longitude === undefined) return [];
    const origin = { latitude, longitude };

    const anchors: PinAnchor[] = [];
    for (const pin of pins) {
      const distance = distanceMeters(origin, pin);
      if (distance > MAX_RENDER_DISTANCE_M) continue;

      anchors.push({
        pin,
        bearingDeg: initialBearingDeg(origin, pin),
        distanceMeters: distance,
        altitudeDeltaM:
          pin.altitude != null && altitude != null ? pin.altitude - altitude : 0,
      });
    }
    return anchors;
    // Depends on the primitive coordinates rather than the coords object, so
    // a new object identity from the GPS watch does not force a recompute.
  }, [pins, latitude, longitude, altitude]);
}
