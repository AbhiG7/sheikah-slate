import * as Location from "expo-location";

import { TerrainElevationSource } from "./elevation";
import { marchRay } from "./rayMarch";
import { TileCache } from "./terrainTiles";
import type { RayMarchResult } from "./types";
import type { Coordinates } from "@/types/geo";

const DEFAULT_MAX_DISTANCE_M = 30_000;
const EYE_HEIGHT_M = 1.6;

export interface IdentifiedTarget {
  coords: Coordinates;
  distanceMeters: number;
  bearingDeg: number;
  elevationMeters: number;
  /** Best-effort place name; null when nothing could be resolved. */
  name: string | null;
  /** Lateral uncertainty at the target, driven by heading accuracy. */
  uncertaintyMeters: number;
}

export type IdentifyResult =
  | { kind: "target"; target: IdentifiedTarget }
  | { kind: "sky" }
  | { kind: "no-data" };

/**
 * Shared tile cache so repeated identifications from one spot reuse the
 * tiles already fetched rather than going back to the network.
 *
 * Exported so the startup preload warms this exact cache: a tap must read
 * memory, not wait on a round trip.
 */
export const sharedTileCache = new TileCache(256);

export interface IdentifyOptions {
  origin: Coordinates;
  bearingDeg: number;
  pitchDeg: number;
  /** Reported compass accuracy in degrees; drives the uncertainty estimate. */
  headingAccuracyDeg?: number;
  maxDistanceMeters?: number;
  /** Injectable for tests. */
  elevationSource?: TerrainElevationSource;
}

/**
 * Answers "what am I looking at" by intersecting the sight-line with terrain,
 * then naming the place it lands on.
 */
export async function identifyTarget(
  options: IdentifyOptions
): Promise<IdentifyResult> {
  const {
    origin,
    bearingDeg,
    pitchDeg,
    headingAccuracyDeg = 3,
    maxDistanceMeters = DEFAULT_MAX_DISTANCE_M,
    elevationSource = new TerrainElevationSource(sharedTileCache),
  } = options;

  await elevationSource.prefetchCorridor(origin, bearingDeg, maxDistanceMeters);

  // Ground elevation beneath the observer is steadier than GPS altitude,
  // which carries 10-30m of error and geoid ambiguity.
  const groundElevation = elevationSource.sample(origin);
  if (groundElevation === null) {
    return { kind: "no-data" };
  }

  const result: RayMarchResult = marchRay(elevationSource, {
    origin,
    observerAltitudeMeters: groundElevation + EYE_HEIGHT_M,
    bearingDeg,
    pitchDeg,
    maxDistanceMeters,
  });

  if (result.kind === "sky") {
    return { kind: "sky" };
  }

  return {
    kind: "target",
    target: {
      coords: result.coords,
      distanceMeters: result.distanceMeters,
      bearingDeg: result.bearingDeg,
      elevationMeters: result.elevationMeters,
      name: await resolveName(result.coords),
      uncertaintyMeters: lateralUncertaintyMeters(
        result.distanceMeters,
        headingAccuracyDeg
      ),
    },
  };
}

/**
 * How far sideways the target could actually be, given compass error. At 8
 * miles a 3 degree error spans about 675m, which is why results are offered
 * as a best guess rather than an assertion.
 */
export function lateralUncertaintyMeters(
  distanceMeters: number,
  headingAccuracyDeg: number
): number {
  return distanceMeters * Math.tan((headingAccuracyDeg * Math.PI) / 180);
}

async function resolveName(coords: Coordinates): Promise<string | null> {
  try {
    const places = await Location.reverseGeocodeAsync(coords);
    const place = places[0];
    if (!place) return null;

    // Prefer the most specific label available for a remote landmark.
    return (
      place.name ??
      place.district ??
      place.subregion ??
      place.city ??
      place.region ??
      null
    );
  } catch {
    return null;
  }
}
