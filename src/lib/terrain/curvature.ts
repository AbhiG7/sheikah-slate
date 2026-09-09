import { EARTH_RADIUS_M } from "@/lib/geo/constants";

/**
 * Standard atmospheric refraction factor. Light bends slightly downward
 * through the atmosphere, which makes the earth behave as though it were
 * ~15% larger and lets you see marginally further than pure geometry allows.
 */
export const REFRACTION_FACTOR = 1.15;

export const EFFECTIVE_EARTH_RADIUS_M = EARTH_RADIUS_M * REFRACTION_FACTOR;

/**
 * How far the curved earth falls away from a straight horizontal line over
 * a given horizontal distance. At 8 miles this is ~11 m, which is the
 * difference between hitting a distant target and sailing over it.
 */
export function curvatureDropMeters(distanceMeters: number): number {
  return (distanceMeters * distanceMeters) / (2 * EFFECTIVE_EARTH_RADIUS_M);
}

/**
 * Distance to the visible horizon for an observer at the given height above
 * the surrounding surface. Roughly 3.1 miles at eye level, which is why
 * everything visible at 5-10 miles has to be a tall feature.
 */
export function horizonDistanceMeters(observerHeightMeters: number): number {
  return Math.sqrt(2 * EFFECTIVE_EARTH_RADIUS_M * observerHeightMeters);
}

/**
 * Altitude above sea level of a sight-line at a given horizontal distance,
 * accounting for the earth falling away beneath it.
 */
export function rayAltitudeMeters(
  observerAltitudeMeters: number,
  pitchDeg: number,
  distanceMeters: number
): number {
  const rise = distanceMeters * Math.tan((pitchDeg * Math.PI) / 180);
  return observerAltitudeMeters + rise - curvatureDropMeters(distanceMeters);
}
