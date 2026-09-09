import { destinationPoint } from "@/lib/geo/haversine";

import { rayAltitudeMeters } from "./curvature";
import type {
  ElevationSource,
  RayMarchOptions,
  RayMarchResult,
} from "./types";

const DEFAULT_MAX_DISTANCE_M = 30_000;
const DEFAULT_MIN_STEP_M = 30;
const DEFAULT_MAX_STEP_M = 250;
const DEFAULT_STEP_GROWTH = 0.01;
const REFINE_ITERATIONS = 12;

/**
 * Marches a sight-line outward until it meets the ground, and reports where.
 *
 * This replaces depth estimation entirely: the distance to a target comes
 * from intersecting a known bearing with a known terrain surface, rather
 * than from parallax, which is unusable past a few metres on phone optics.
 *
 * Steps grow with distance because a fixed fine step wastes work far away,
 * where each step subtends a tiny angle anyway. The tradeoff is that a very
 * thin ridge can be stepped over at long range; at 10 km a 250 m step spans
 * about 1.4 degrees, which is comparable to compass error and so is not the
 * dominant source of error.
 */
export function marchRay(
  elevation: ElevationSource,
  options: RayMarchOptions
): RayMarchResult {
  const {
    origin,
    observerAltitudeMeters,
    bearingDeg,
    pitchDeg,
    maxDistanceMeters = DEFAULT_MAX_DISTANCE_M,
    minStepMeters = DEFAULT_MIN_STEP_M,
    maxStepMeters = DEFAULT_MAX_STEP_M,
    stepGrowthRatio = DEFAULT_STEP_GROWTH,
  } = options;

  const stepFor = (distance: number) =>
    Math.min(maxStepMeters, Math.max(minStepMeters, distance * stepGrowthRatio));

  const altitudeAt = (distance: number) =>
    rayAltitudeMeters(observerAltitudeMeters, pitchDeg, distance);

  let previousDistance = 0;
  let distance = stepFor(0);

  while (distance <= maxDistanceMeters) {
    const point = destinationPoint(origin, bearingDeg, distance);
    const ground = elevation.sample(point);

    if (ground !== null && ground >= altitudeAt(distance)) {
      return refineHit(
        elevation,
        options,
        previousDistance,
        distance,
        altitudeAt
      );
    }

    previousDistance = distance;
    distance += stepFor(distance);
  }

  return {
    kind: "sky",
    bearingDeg,
    searchedToMeters: maxDistanceMeters,
  };
}

/**
 * Binary search between the last miss and the first hit. Twelve iterations
 * narrows a 250 m step to under 10 cm, far below the resolution of the
 * underlying elevation data, so the hit distance is limited by the DEM
 * rather than by the search.
 */
function refineHit(
  elevation: ElevationSource,
  options: RayMarchOptions,
  missDistance: number,
  hitDistance: number,
  altitudeAt: (d: number) => number
): RayMarchResult {
  const { origin, bearingDeg } = options;

  let low = missDistance;
  let high = hitDistance;

  for (let i = 0; i < REFINE_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const ground = elevation.sample(destinationPoint(origin, bearingDeg, mid));

    if (ground !== null && ground >= altitudeAt(mid)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const coords = destinationPoint(origin, bearingDeg, high);
  const elevationMeters = elevation.sample(coords) ?? altitudeAt(high);

  return {
    kind: "terrain",
    coords,
    elevationMeters,
    distanceMeters: high,
    bearingDeg,
  };
}
