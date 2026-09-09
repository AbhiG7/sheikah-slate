function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Signed angular difference from `heading` to `bearing`, in degrees,
 * normalized to (-180, 180]. Positive means the target is clockwise
 * (to the right) of the current heading.
 */
export function angularDelta(bearingDeg: number, headingDeg: number): number {
  return ((bearingDeg - headingDeg + 540) % 360) - 180;
}

export interface HorizontalProjection {
  /** Screen-space X in [0, screenWidth], or null if outside the FOV. */
  screenX: number | null;
  relativeAngleDeg: number;
}

/**
 * Projects a bearing into a horizontal screen X position using a
 * perspective-correct tan() mapping (linear angle-to-pixel mapping
 * distorts noticeably near the edges of the frame).
 */
export function projectHorizontal(
  bearingDeg: number,
  headingDeg: number,
  screenWidth: number,
  horizontalFovDeg: number
): HorizontalProjection {
  const relativeAngleDeg = angularDelta(bearingDeg, headingDeg);
  const halfFov = horizontalFovDeg / 2;

  if (Math.abs(relativeAngleDeg) > halfFov) {
    return { screenX: null, relativeAngleDeg };
  }

  const ratio = Math.tan(toRadians(relativeAngleDeg)) / Math.tan(toRadians(halfFov));
  const screenX = screenWidth / 2 + ratio * (screenWidth / 2);

  return { screenX, relativeAngleDeg };
}

/**
 * Inverse of projectHorizontal: the bearing offset, in degrees relative to
 * where the camera is pointed, for a given screen X. Used to cast a ray
 * through the exact point the user tapped rather than through the centre
 * of the screen.
 */
export function unprojectHorizontal(
  screenX: number,
  screenWidth: number,
  horizontalFovDeg: number
): number {
  const halfFov = horizontalFovDeg / 2;
  const ratio = (screenX - screenWidth / 2) / (screenWidth / 2);
  const radians = Math.atan(ratio * Math.tan(toRadians(halfFov)));
  return (radians * 180) / Math.PI;
}

/**
 * Inverse of the pitch term in projectVertical: the absolute pitch of the
 * ray passing through a given screen Y. Screen Y grows downward, so a tap
 * above centre yields a pitch above the device's own.
 */
export function unprojectVertical(
  screenY: number,
  screenHeight: number,
  verticalFovDeg: number,
  devicePitchDeg: number
): number {
  const halfFov = verticalFovDeg / 2;
  const ratio = (screenY - screenHeight / 2) / (screenHeight / 2);
  return devicePitchDeg - ratio * halfFov;
}

/**
 * Projects a pin's elevation (relative to the user) and the device's
 * current pitch into a vertical screen Y for the beam's base point.
 */
export function projectVertical(
  distanceMeters: number,
  altitudeDeltaMeters: number,
  devicePitchDeg: number,
  screenHeight: number,
  verticalFovDeg: number
): number {
  const elevationAngleDeg =
    distanceMeters > 0
      ? (Math.atan2(altitudeDeltaMeters, distanceMeters) * 180) / Math.PI
      : 0;

  // Positive pitch = phone tilted up, which should push the horizon (and
  // everything on it) down on screen.
  const horizonY = screenHeight / 2 + (devicePitchDeg / (verticalFovDeg / 2)) * (screenHeight / 2);
  const halfFov = verticalFovDeg / 2;
  const offsetRatio = elevationAngleDeg / halfFov;

  return horizonY - offsetRatio * (screenHeight / 2);
}
