import {
  BEAM_WORLD_HEIGHT_M,
  MIN_BEAM_SCREEN_PX,
} from "@/lib/geo/constants";

const DEG_TO_RAD = Math.PI / 180;

/**
 * Mirrors the height calculation inlined in the Beam worklet.
 *
 * The worklet cannot call imported helpers, so the maths lives there in
 * full. This keeps a checkable copy: if the two drift apart, the intent
 * recorded here is the one to trust.
 */
function beamHeightPx(
  distanceMeters: number,
  screenHeight = 400,
  verticalFovDeg = 41
): number {
  const halfVertical = verticalFovDeg / 2;
  const horizonY = screenHeight / 2;

  const baseElevation = 0;
  const topElevation =
    Math.atan2(BEAM_WORLD_HEIGHT_M, distanceMeters) / DEG_TO_RAD;

  const baseY = horizonY - (baseElevation / halfVertical) * (screenHeight / 2);
  const topY = horizonY - (topElevation / halfVertical) * (screenHeight / 2);

  return Math.min(screenHeight, Math.max(MIN_BEAM_SCREEN_PX, baseY - topY));
}

describe("beam height as a world-space pillar", () => {
  it("shrinks as the pin gets further away", () => {
    expect(beamHeightPx(2000)).toBeGreaterThan(beamHeightPx(5000));
    expect(beamHeightPx(5000)).toBeGreaterThan(beamHeightPx(10_000));
  });

  it("halves when the distance doubles, the signature of perspective", () => {
    // Far enough out that the small-angle approximation holds and neither
    // the floor nor the viewport cap is masking the relationship.
    expect(beamHeightPx(6000) / beamHeightPx(12_000)).toBeCloseTo(2, 1);
  });

  it("never draws shorter than the minimum, so far pins stay findable", () => {
    expect(beamHeightPx(50_000)).toBe(MIN_BEAM_SCREEN_PX);
  });

  it("towers off the frame when you are close, capped at the viewport", () => {
    expect(beamHeightPx(100, 400)).toBe(400);
  });

  it("keeps perspective meaningful across the app's working range", () => {
    const sizes = [2000, 4000, 8000, 12_000].map((d) => beamHeightPx(d));
    expect(new Set(sizes.map((v) => Math.round(v))).size).toBe(4);
    expect(Math.min(...sizes)).toBeGreaterThan(MIN_BEAM_SCREEN_PX);
  });

  it("is always positive, so a beam is never inverted", () => {
    for (const distance of [10, 100, 1000, 10_000, 40_000]) {
      expect(beamHeightPx(distance)).toBeGreaterThan(0);
    }
  });

  it("grows with a narrower field of view, matching a zoomed lens", () => {
    expect(beamHeightPx(8000, 400, 20)).toBeGreaterThan(
      beamHeightPx(8000, 400, 41)
    );
  });
});
