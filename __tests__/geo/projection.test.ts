import {
  angularDelta,
  projectHorizontal,
  projectVertical,
} from "@/lib/geo/projection";

describe("angularDelta", () => {
  it("returns 0 when bearing equals heading", () => {
    expect(angularDelta(90, 90)).toBeCloseTo(0);
  });

  it("returns a positive value when the target is clockwise of heading", () => {
    expect(angularDelta(100, 90)).toBeCloseTo(10);
  });

  it("returns a negative value when the target is counter-clockwise", () => {
    expect(angularDelta(80, 90)).toBeCloseTo(-10);
  });

  it("wraps correctly across the 0/360 boundary", () => {
    expect(angularDelta(5, 355)).toBeCloseTo(10);
    expect(angularDelta(355, 5)).toBeCloseTo(-10);
  });

  it("handles a full reversal (180 degrees) without ambiguity", () => {
    expect(Math.abs(angularDelta(270, 90))).toBeCloseTo(180);
  });
});

describe("projectHorizontal", () => {
  const screenWidth = 1000;
  const fov = 68;

  it("places a pin directly ahead at screen center", () => {
    const { screenX } = projectHorizontal(90, 90, screenWidth, fov);
    expect(screenX).toBeCloseTo(screenWidth / 2, 1);
  });

  it("places a pin at the FOV edge at the screen edge", () => {
    const rightEdge = projectHorizontal(90 + fov / 2, 90, screenWidth, fov);
    expect(rightEdge.screenX).not.toBeNull();
    expect(rightEdge.screenX as number).toBeCloseTo(screenWidth, 0);

    const leftEdge = projectHorizontal(90 - fov / 2, 90, screenWidth, fov);
    expect(leftEdge.screenX).not.toBeNull();
    expect(leftEdge.screenX as number).toBeCloseTo(0, 0);
  });

  it("returns null screenX for a pin outside the FOV", () => {
    const behind = projectHorizontal(270, 90, screenWidth, fov);
    expect(behind.screenX).toBeNull();
  });

  it("moves toward the right edge as the pin gets closer to +halfFov", () => {
    const near = projectHorizontal(90 + fov / 2 - 5, 90, screenWidth, fov);
    const far = projectHorizontal(90 + fov / 2 - 20, 90, screenWidth, fov);
    expect(near.screenX as number).toBeGreaterThan(far.screenX as number);
  });
});

describe("projectVertical", () => {
  const screenHeight = 800;
  const vFov = 41;

  it("places a pin at the same altitude, viewed level, near the horizon", () => {
    const y = projectVertical(1000, 0, 0, screenHeight, vFov);
    expect(y).toBeCloseTo(screenHeight / 2, 0);
  });

  it("moves the beam base down on screen as the device tilts up (positive pitch)", () => {
    const level = projectVertical(1000, 0, 0, screenHeight, vFov);
    const tiltedUp = projectVertical(1000, 0, 10, screenHeight, vFov);
    expect(tiltedUp).toBeGreaterThan(level);
  });

  it("places a higher pin (positive altitude delta) above the horizon", () => {
    const level = projectVertical(1000, 0, 0, screenHeight, vFov);
    const higher = projectVertical(1000, 100, 0, screenHeight, vFov);
    expect(higher).toBeLessThan(level);
  });
});
