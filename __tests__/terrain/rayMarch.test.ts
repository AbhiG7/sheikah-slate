import { distanceMeters } from "@/lib/geo/haversine";
import {
  curvatureDropMeters,
  horizonDistanceMeters,
} from "@/lib/terrain/curvature";
import { marchRay } from "@/lib/terrain/rayMarch";
import type { ElevationSource } from "@/lib/terrain/types";
import type { Coordinates } from "@/types/geo";

const ORIGIN: Coordinates = { latitude: 47.0, longitude: -122.0 };

/** Sea-level everywhere. Lets us check the marcher against closed-form answers. */
const flatSeaLevel: ElevationSource = { sample: () => 0 };

/** Sea level, except a wall of the given height beyond the given distance. */
function ridgeBeyond(distance: number, height: number): ElevationSource {
  return {
    sample: (coords) =>
      distanceMeters(ORIGIN, coords) >= distance ? height : 0,
  };
}

describe("curvature", () => {
  it("matches the textbook ~8cm drop at 1km", () => {
    expect(curvatureDropMeters(1000)).toBeCloseTo(0.068, 2);
  });

  it("puts the eye-level horizon near 3.1 miles", () => {
    const miles = horizonDistanceMeters(1.7) / 1609.34;
    expect(miles).toBeGreaterThan(2.9);
    expect(miles).toBeLessThan(3.3);
  });

  it("grows the drop with the square of distance", () => {
    const near = curvatureDropMeters(1000);
    const far = curvatureDropMeters(2000);
    expect(far / near).toBeCloseTo(4, 1);
  });
});

describe("marchRay over flat sea-level terrain", () => {
  it("hits the ground at exactly the analytic horizon distance", () => {
    const observerHeight = 10;
    const result = marchRay(flatSeaLevel, {
      origin: ORIGIN,
      observerAltitudeMeters: observerHeight,
      bearingDeg: 90,
      pitchDeg: 0,
    });

    expect(result.kind).toBe("terrain");
    if (result.kind !== "terrain") return;

    // A level sight-line meets a sea-level surface precisely at the horizon.
    expect(result.distanceMeters).toBeCloseTo(
      horizonDistanceMeters(observerHeight),
      -1
    );
  });

  it("sees further from higher up", () => {
    const low = marchRay(flatSeaLevel, {
      origin: ORIGIN,
      observerAltitudeMeters: 10,
      bearingDeg: 90,
      pitchDeg: 0,
    });
    const high = marchRay(flatSeaLevel, {
      origin: ORIGIN,
      observerAltitudeMeters: 40,
      bearingDeg: 90,
      pitchDeg: 0,
    });

    expect(low.kind).toBe("terrain");
    expect(high.kind).toBe("terrain");
    if (low.kind !== "terrain" || high.kind !== "terrain") return;

    // Horizon scales with the square root of height, so 4x height is 2x range.
    expect(high.distanceMeters / low.distanceMeters).toBeCloseTo(2, 1);
  });

  it("returns sky when aimed above the horizon", () => {
    const result = marchRay(flatSeaLevel, {
      origin: ORIGIN,
      observerAltitudeMeters: 10,
      bearingDeg: 90,
      pitchDeg: 10,
    });

    expect(result.kind).toBe("sky");
  });

  it("hits close by when aimed steeply down", () => {
    const result = marchRay(flatSeaLevel, {
      origin: ORIGIN,
      observerAltitudeMeters: 100,
      bearingDeg: 90,
      pitchDeg: -30,
    });

    expect(result.kind).toBe("terrain");
    if (result.kind !== "terrain") return;
    // 100m up at 30 degrees down reaches the ground at 100/tan(30) = 173m.
    expect(result.distanceMeters).toBeCloseTo(173, -1);
  });
});

describe("marchRay against a ridge", () => {
  it("stops at the ridge rather than the horizon", () => {
    const result = marchRay(ridgeBeyond(5000, 500), {
      origin: ORIGIN,
      observerAltitudeMeters: 10,
      bearingDeg: 90,
      pitchDeg: 0,
    });

    expect(result.kind).toBe("terrain");
    if (result.kind !== "terrain") return;

    expect(result.distanceMeters).toBeGreaterThan(4900);
    expect(result.distanceMeters).toBeLessThan(5100);
    expect(result.elevationMeters).toBe(500);
  });

  it("looks over a low near ridge and hits the horizon beyond it", () => {
    // A 5m band at 3-3.5km. From 20m up the level ray has dropped only ~0.6m
    // by then, so it clears the band and carries on to the sea-level horizon.
    const band: ElevationSource = {
      sample: (coords) => {
        const d = distanceMeters(ORIGIN, coords);
        return d >= 3000 && d <= 3500 ? 5 : 0;
      },
    };

    const result = marchRay(band, {
      origin: ORIGIN,
      observerAltitudeMeters: 20,
      bearingDeg: 90,
      pitchDeg: 0,
    });

    expect(result.kind).toBe("terrain");
    if (result.kind !== "terrain") return;
    expect(result.distanceMeters).toBeCloseTo(horizonDistanceMeters(20), -2);
  });

  it("reports the bearing it was given", () => {
    const result = marchRay(ridgeBeyond(2000, 800), {
      origin: ORIGIN,
      observerAltitudeMeters: 10,
      bearingDeg: 237,
      pitchDeg: 0,
    });
    expect(result.bearingDeg).toBe(237);
  });
});

describe("marchRay with missing data", () => {
  it("keeps searching through gaps rather than reporting a false hit", () => {
    const holeyRidge: ElevationSource = {
      sample: (coords) => {
        const d = distanceMeters(ORIGIN, coords);
        if (d < 4000) return null; // no coverage near the observer
        return d >= 6000 ? 400 : 0;
      },
    };

    const result = marchRay(holeyRidge, {
      origin: ORIGIN,
      observerAltitudeMeters: 10,
      bearingDeg: 0,
      pitchDeg: 0,
    });

    expect(result.kind).toBe("terrain");
    if (result.kind !== "terrain") return;
    expect(result.distanceMeters).toBeGreaterThan(5900);
  });
});
