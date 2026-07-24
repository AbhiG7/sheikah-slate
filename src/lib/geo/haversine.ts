import type { Coordinates } from "@/types/geo";

import { EARTH_RADIUS_M } from "./constants";

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Great-circle distance between two coordinates, in meters. */
export function distanceMeters(from: Coordinates, to: Coordinates): number {
  const phi1 = toRadians(from.latitude);
  const phi2 = toRadians(to.latitude);
  const deltaPhi = toRadians(to.latitude - from.latitude);
  const deltaLambda = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/** Initial bearing from `from` to `to`, in degrees, range [0, 360). */
export function initialBearingDeg(from: Coordinates, to: Coordinates): number {
  const phi1 = toRadians(from.latitude);
  const phi2 = toRadians(to.latitude);
  const deltaLambda = toRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);

  return (toDegrees(theta) + 360) % 360;
}

/**
 * Forward geodesic: the coordinate reached by travelling `distance` meters
 * from `origin` along `bearingDeg`. Used for the "aim + manual distance"
 * pin placement mode, where the real-world distance is user-estimated.
 */
export function destinationPoint(
  origin: Coordinates,
  bearingDeg: number,
  distance: number
): Coordinates {
  const delta = distance / EARTH_RADIUS_M;
  const theta = toRadians(bearingDeg);
  const phi1 = toRadians(origin.latitude);
  const lambda1 = toRadians(origin.longitude);

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) +
      Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
    );

  return {
    latitude: toDegrees(phi2),
    longitude: ((toDegrees(lambda2) + 540) % 360) - 180,
  };
}
