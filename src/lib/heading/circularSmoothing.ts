function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Exponential moving average over a heading's unit vector rather than the
 * raw degree value, since heading wraps at 0/360 and a naive scalar EMA
 * produces huge spurious jumps whenever a reading crosses that boundary.
 */
export class CircularEma {
  private x: number | null = null;
  private y: number | null = null;

  constructor(private readonly alpha: number = 0.18) {}

  next(rawHeadingDeg: number): number {
    const rad = toRadians(rawHeadingDeg);
    const sampleX = Math.cos(rad);
    const sampleY = Math.sin(rad);

    if (this.x === null || this.y === null) {
      this.x = sampleX;
      this.y = sampleY;
    } else {
      this.x = this.x * (1 - this.alpha) + sampleX * this.alpha;
      this.y = this.y * (1 - this.alpha) + sampleY * this.alpha;
    }

    return (toDegrees(Math.atan2(this.y, this.x)) + 360) % 360;
  }

  reset(): void {
    this.x = null;
    this.y = null;
  }
}
