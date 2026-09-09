export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Camera pitch in degrees from a gravity vector, positive above horizontal.
 *
 * Derived from gravity rather than from Euler angles because the rear camera
 * points along the device's -Z axis, and the angle between that axis and
 * gravity is unaffected by how the phone is rolled. The previous
 * `rotation.beta - 90` approach broke as soon as the phone was tilted
 * sideways, and produced nothing at all on web, where DeviceMotion reports
 * no rotation field.
 *
 * Returns 0 for a degenerate (zero-length) reading.
 */
export function pitchFromGravity(gravity: Vector3, sign = 1): number {
  const { x, y, z } = gravity;
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (magnitude === 0) return 0;

  const normalizedZ = (sign * z) / magnitude;
  const clamped = Math.min(1, Math.max(-1, normalizedZ));

  return (Math.asin(clamped) * 180) / Math.PI;
}

/**
 * Low-pass filter isolating gravity from an accelerometer reading that also
 * contains hand movement. Gravity is constant, so a slow EMA converges on it
 * while transient motion averages out.
 */
export class GravityFilter {
  private current: Vector3 | null = null;

  constructor(private readonly alpha = 0.1) {}

  next(sample: Vector3): Vector3 {
    if (!this.current) {
      this.current = { ...sample };
      return this.current;
    }

    this.current = {
      x: this.current.x * (1 - this.alpha) + sample.x * this.alpha,
      y: this.current.y * (1 - this.alpha) + sample.y * this.alpha,
      z: this.current.z * (1 - this.alpha) + sample.z * this.alpha,
    };
    return this.current;
  }

  reset(): void {
    this.current = null;
  }
}
