import { useEffect, useState } from "react";

import type { UserLocationState } from "./useUserLocation";

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  // Without a timeout a stalled provider hangs forever with no signal.
  timeout: 20_000,
  maximumAge: 5_000,
};

/** Why geolocation cannot run here at all, or null if it can. */
function unavailableReason(): string | null {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    // Browsers refuse geolocation outside a secure context, and this is by
    // far the most common reason everything looks dead at once: the same
    // rule also blocks the camera and motion sensors.
    if (typeof globalThis !== "undefined" && globalThis.isSecureContext === false) {
      return "Needs HTTPS. This page is not a secure context.";
    }
    return "Geolocation is not available in this browser.";
  }
  return null;
}

function describe(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied for this site.";
    case error.POSITION_UNAVAILABLE:
      return "Position unavailable. No GPS or network fix.";
    case error.TIMEOUT:
      return "Timed out waiting for a position fix.";
    default:
      return error.message || "Unknown geolocation error.";
  }
}

/**
 * Browser geolocation, used instead of expo-location on web.
 *
 * expo-location's web build calls navigator.geolocation.watchPosition with
 * `undefined` as the error callback, so a denied permission, a dead provider
 * or a timeout all fail completely silently and are indistinguishable from
 * "still waiting". Going direct lets failures actually surface.
 */
export function useUserLocation(): UserLocationState {
  // Lazy initialiser so the environment is inspected on the client during
  // first render, rather than synchronously inside an effect.
  const [state, setState] = useState<UserLocationState>(() => ({
    coords: null,
    accuracy: null,
    error: unavailableReason(),
  }));

  useEffect(() => {
    if (unavailableReason() !== null) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
          },
          accuracy: position.coords.accuracy,
          error: null,
        });
      },
      (error) => {
        setState((previous) => ({ ...previous, error: describe(error) }));
      },
      OPTIONS
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
