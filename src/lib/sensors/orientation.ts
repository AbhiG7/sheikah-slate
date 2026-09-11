/**
 * Device orientation to camera direction.
 *
 * The browser's deviceorientation event reports alpha, beta and gamma,
 * which iOS derives from CoreMotion by fusing gyroscope, accelerometer and
 * magnetometer. Reading only webkitCompassHeading throws that fusion away
 * and keeps just the noisy magnetometer part, which is why beams lag and
 * drift.
 *
 * These angles are intrinsic Z-X'-Y'' Tait-Bryan angles in a device frame
 * where x is right, y is the top edge and z points out of the screen. The
 * world frame is east-north-up.
 *
 * Everything here derives from the camera's forward *vector* rather than
 * from any single angle. That matters: the Euler angles are degenerate when
 * the phone is held upright, which is the only way this app is ever used.
 * At beta = 90 the alpha and gamma rotations act about the same world axis
 * and trade off against each other, so heading read from alpha alone is
 * unstable. The forward vector stays well defined at every attitude.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraOrientation {
  /** Unit vector the rear camera points along, in east-north-up. */
  forward: Vec3;
  /** Compass bearing of that vector, degrees clockwise from north. */
  headingDeg: number;
  /** Degrees above the horizon, negative below. */
  pitchDeg: number;
}

type Matrix3 = [number, number, number, number, number, number, number, number, number];

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

function multiply(a: Matrix3, b: Matrix3): Matrix3 {
  const out = new Array(9).fill(0) as number[];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) sum += a[row * 3 + k] * b[k * 3 + col];
      out[row * 3 + col] = sum;
    }
  }
  return out as Matrix3;
}

function apply(m: Matrix3, v: Vec3): Vec3 {
  return {
    x: m[0] * v.x + m[1] * v.y + m[2] * v.z,
    y: m[3] * v.x + m[4] * v.y + m[5] * v.z,
    z: m[6] * v.x + m[7] * v.y + m[8] * v.z,
  };
}

function rotationZ(rad: number): Matrix3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function rotationX(rad: number): Matrix3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

function rotationY(rad: number): Matrix3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

/** Device-to-world rotation for the given orientation angles. */
export function deviceRotationMatrix(
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number
): Matrix3 {
  return multiply(
    multiply(rotationZ(toRadians(alphaDeg)), rotationX(toRadians(betaDeg))),
    rotationY(toRadians(gammaDeg))
  );
}

/**
 * Where the rear camera is pointing, given the device orientation angles.
 *
 * `screenOrientationDeg` does not affect the camera direction at all: the
 * lens is bolted to the chassis, so rotating the display changes nothing
 * about where it looks. It is needed only to work out which world direction
 * is "screen right", which `cameraBasis` handles.
 */
export function cameraOrientation(
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number
): CameraOrientation {
  const rotation = deviceRotationMatrix(alphaDeg, betaDeg, gammaDeg);
  // The rear camera looks along the device's -Z axis.
  const forward = apply(rotation, { x: 0, y: 0, z: -1 });

  // x is east and y is north, so atan2(east, north) is a compass bearing
  // measured clockwise from north. alpha runs anticlockwise, and this
  // conversion already accounts for that.
  const headingDeg = (toDegrees(Math.atan2(forward.x, forward.y)) + 360) % 360;
  const pitchDeg = toDegrees(Math.asin(Math.max(-1, Math.min(1, forward.z))));

  return { forward, headingDeg, pitchDeg };
}

export interface CameraBasis {
  forward: Vec3;
  right: Vec3;
  up: Vec3;
}

/**
 * Full camera basis in world coordinates.
 *
 * Needed to project a world direction onto the screen properly. The screen's
 * right and up axes depend on how the display is rotated relative to the
 * chassis, which is what `screenOrientationDeg` (window.orientation) carries.
 */
export function cameraBasis(
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
  screenOrientationDeg: number
): CameraBasis {
  const rotation = deviceRotationMatrix(alphaDeg, betaDeg, gammaDeg);
  const screen = rotationZ(toRadians(screenOrientationDeg));
  const deviceToWorld = multiply(rotation, screen);

  return {
    forward: apply(rotation, { x: 0, y: 0, z: -1 }),
    right: apply(deviceToWorld, { x: 1, y: 0, z: 0 }),
    up: apply(deviceToWorld, { x: 0, y: 1, z: 0 }),
  };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Unit vector pointing along a compass bearing and elevation, in ENU. */
export function directionFromBearing(
  bearingDeg: number,
  elevationDeg: number
): Vec3 {
  const bearing = toRadians(bearingDeg);
  const elevation = toRadians(elevationDeg);
  const horizontal = Math.cos(elevation);
  return {
    x: horizontal * Math.sin(bearing),
    y: horizontal * Math.cos(bearing),
    z: Math.sin(elevation),
  };
}
