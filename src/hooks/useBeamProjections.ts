import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import {
  DEFAULT_HORIZONTAL_FOV_DEG,
  DEFAULT_VERTICAL_FOV_DEG,
  MAX_RENDER_DISTANCE_M,
} from "@/lib/geo/constants";
import { distanceMeters, initialBearingDeg } from "@/lib/geo/haversine";
import { projectHorizontal, projectVertical } from "@/lib/geo/projection";
import type { Pin } from "@/types/pin";

import { useFovMultiplier } from "./useFovMultiplier";
import type { UserLocationState } from "./useUserLocation";

export interface BeamProjection {
  pin: Pin;
  screenX: number;
  baseY: number;
  distanceMeters: number;
  bearingDeg: number;
  relativeAngleDeg: number;
}

/**
 * Projects every stored pin into screen space given the user's current
 * location, heading, and device pitch. Pins outside the max render
 * distance or the camera's field of view are cheaply culled before the
 * per-pin trig runs.
 */
export function useBeamProjections(
  pins: Pin[],
  location: UserLocationState,
  headingDeg: number,
  pitchDeg: number
): BeamProjection[] {
  const { width, height } = useWindowDimensions();
  const [fovMultiplier] = useFovMultiplier();

  return useMemo(() => {
    if (!location.coords) return [];
    const origin = location.coords;

    const horizontalFov = DEFAULT_HORIZONTAL_FOV_DEG * fovMultiplier;
    const verticalFov = DEFAULT_VERTICAL_FOV_DEG * fovMultiplier;

    const projections: BeamProjection[] = [];

    for (const pin of pins) {
      const distance = distanceMeters(origin, pin);
      if (distance > MAX_RENDER_DISTANCE_M) continue;

      const bearingDeg = initialBearingDeg(origin, pin);
      const { screenX, relativeAngleDeg } = projectHorizontal(
        bearingDeg,
        headingDeg,
        width,
        horizontalFov
      );
      if (screenX === null) continue;

      const altitudeDelta =
        pin.altitude != null && origin.altitude != null
          ? pin.altitude - origin.altitude
          : 0;
      const baseY = projectVertical(
        distance,
        altitudeDelta,
        pitchDeg,
        height,
        verticalFov
      );

      projections.push({
        pin,
        screenX,
        baseY,
        distanceMeters: distance,
        bearingDeg,
        relativeAngleDeg,
      });
    }

    return projections;
  }, [pins, location.coords, headingDeg, pitchDeg, width, height, fovMultiplier]);
}
