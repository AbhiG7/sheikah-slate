import { angularDelta } from "@/lib/geo/projection";
import type { Coordinates } from "@/types/geo";

const M_PER_DEG_LAT = 111_320;
const DEG_TO_RAD = Math.PI / 180;

export interface LocalPoint {
  /** Metres east of the observer. */
  east: number;
  /** Metres north of the observer. */
  north: number;
}

/**
 * Flat-earth projection of a nearby point into metres from the observer.
 *
 * An equirectangular approximation is more than good enough here: buildings
 * are tens of metres across and never more than a couple of kilometres away,
 * where the error from ignoring curvature is millimetres.
 */
export function toLocalMeters(
  observer: Coordinates,
  point: Coordinates
): LocalPoint {
  const metresPerDegLon =
    M_PER_DEG_LAT * Math.cos(observer.latitude * DEG_TO_RAD);
  return {
    east: (point.longitude - observer.longitude) * metresPerDegLon,
    north: (point.latitude - observer.latitude) * M_PER_DEG_LAT,
  };
}

/** Compass bearing from the observer to a nearby point, degrees from north. */
export function localBearingDeg(
  observer: Coordinates,
  point: Coordinates
): number {
  const { east, north } = toLocalMeters(observer, point);
  return ((Math.atan2(east, north) / DEG_TO_RAD) + 360) % 360;
}

export interface AngularExtent {
  /** Most anticlockwise edge, in degrees relative to the ray. */
  minDeltaDeg: number;
  /** Most clockwise edge, in degrees relative to the ray. */
  maxDeltaDeg: number;
  /** Total angular width the footprint occupies. */
  spanDeg: number;
}

/**
 * How wide a footprint appears, measured relative to the ray that hit it.
 *
 * Everything is expressed as a signed offset from the ray rather than as
 * absolute bearings, which sidesteps the wrap at due north: a building
 * straddling 0 degrees would otherwise report bounds of 355 and 5 and look
 * 350 degrees wide. Holds for any footprint narrower than a half-turn,
 * which is every building you are not standing inside.
 */
export function angularExtent(
  observer: Coordinates,
  rayBearingDeg: number,
  polygon: Coordinates[]
): AngularExtent {
  let minDeltaDeg = Infinity;
  let maxDeltaDeg = -Infinity;

  for (const vertex of polygon) {
    const delta = angularDelta(
      localBearingDeg(observer, vertex),
      rayBearingDeg
    );
    if (delta < minDeltaDeg) minDeltaDeg = delta;
    if (delta > maxDeltaDeg) maxDeltaDeg = delta;
  }

  return {
    minDeltaDeg,
    maxDeltaDeg,
    spanDeg: maxDeltaDeg - minDeltaDeg,
  };
}

/** Error function, Abramowitz and Stegun 7.1.26. Accurate to ~1.5e-7. */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const abs = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * abs);
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-abs * abs);

  return sign * y;
}

/** Standard normal cumulative distribution. */
function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * Probability that the building we hit is the one actually being aimed at.
 *
 * Treats heading error as normally distributed with the compass's own
 * reported accuracy as the standard deviation, then integrates that
 * distribution across the angular slice the footprint occupies. A wide
 * building close by covers many standard deviations and comes out near
 * certain; a narrow one far away covers a fraction of one and does not.
 *
 * This is what lets the app name a single building rather than offer a list:
 * it can tell the difference between knowing and guessing.
 */
export function identificationConfidence(
  extent: AngularExtent,
  headingAccuracyDeg: number
): number {
  // A perfect compass would make any hit certain; keep a floor so the
  // result stays meaningful rather than dividing by zero.
  const sigma = Math.max(0.25, headingAccuracyDeg);

  const upper = normalCdf(extent.maxDeltaDeg / sigma);
  const lower = normalCdf(extent.minDeltaDeg / sigma);

  return Math.min(1, Math.max(0, upper - lower));
}

/**
 * Distance along a bearing to where it first crosses a footprint's outline,
 * or null if it misses. Returns 0 when the observer is inside the footprint.
 */
export function rayPolygonDistance(
  observer: Coordinates,
  bearingDeg: number,
  polygon: Coordinates[]
): number | null {
  if (polygon.length < 3) return null;

  const local = polygon.map((vertex) => toLocalMeters(observer, vertex));
  if (isInside({ east: 0, north: 0 }, local)) return 0;

  const bearing = bearingDeg * DEG_TO_RAD;
  const dirEast = Math.sin(bearing);
  const dirNorth = Math.cos(bearing);

  let nearest: number | null = null;

  for (let i = 0; i < local.length; i++) {
    const a = local[i];
    const b = local[(i + 1) % local.length];

    const edgeEast = b.east - a.east;
    const edgeNorth = b.north - a.north;

    // Cross product of ray direction with the edge; zero means parallel.
    const denominator = dirEast * edgeNorth - dirNorth * edgeEast;
    if (Math.abs(denominator) < 1e-12) continue;

    const alongRay =
      (a.east * edgeNorth - a.north * edgeEast) / denominator;
    const alongEdge =
      (a.east * dirNorth - a.north * dirEast) / denominator;

    if (alongRay >= 0 && alongEdge >= 0 && alongEdge <= 1) {
      if (nearest === null || alongRay < nearest) nearest = alongRay;
    }
  }

  return nearest;
}

/** Even-odd ray casting test for a point inside a polygon. */
function isInside(point: LocalPoint, polygon: LocalPoint[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];

    const straddles = a.north > point.north !== b.north > point.north;
    if (!straddles) continue;

    const crossingEast =
      ((b.east - a.east) * (point.north - a.north)) / (b.north - a.north) +
      a.east;
    if (point.east < crossingEast) inside = !inside;
  }

  return inside;
}
