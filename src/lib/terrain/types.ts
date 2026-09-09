import type { Coordinates } from "@/types/geo";

/**
 * Reads terrain elevation in metres above sea level. Synchronous by design:
 * tiles are prefetched for the whole ray corridor before marching, which
 * keeps the marcher a pure function and therefore unit-testable against a
 * synthetic surface.
 *
 * Returns null where no data is loaded for that position.
 */
export interface ElevationSource {
  sample(coords: Coordinates): number | null;
}

export interface RayMarchOptions {
  origin: Coordinates;
  /** Observer altitude above sea level, including eye height. */
  observerAltitudeMeters: number;
  bearingDeg: number;
  /** Positive is above horizontal. */
  pitchDeg: number;
  maxDistanceMeters?: number;
  minStepMeters?: number;
  maxStepMeters?: number;
  /** Step grows as this fraction of current distance. */
  stepGrowthRatio?: number;
}

export interface TerrainHit {
  kind: "terrain";
  coords: Coordinates;
  /** Ground elevation at the hit, metres above sea level. */
  elevationMeters: number;
  /** Horizontal distance from the observer. */
  distanceMeters: number;
  bearingDeg: number;
}

export interface SkyResult {
  kind: "sky";
  bearingDeg: number;
  /** How far the ray was traced before giving up. */
  searchedToMeters: number;
}

export type RayMarchResult = TerrainHit | SkyResult;
