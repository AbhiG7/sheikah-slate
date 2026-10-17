import {
  angularExtent,
  identificationConfidence,
  localBearingDeg,
  rayPolygonDistance,
  toLocalMeters,
} from "@/lib/buildings/geometry";
import type { Coordinates } from "@/types/geo";

const OBSERVER: Coordinates = { latitude: 40.7484, longitude: -73.9857 };
const M_PER_DEG_LAT = 111_320;

/** A square footprint of the given width, centred `north` metres away. */
function squareNorthOf(
  distanceM: number,
  widthM: number,
  observer: Coordinates = OBSERVER
): Coordinates[] {
  const dLat = (m: number) => m / M_PER_DEG_LAT;
  const dLon = (m: number) =>
    m / (M_PER_DEG_LAT * Math.cos((observer.latitude * Math.PI) / 180));

  const half = widthM / 2;
  return [
    { latitude: observer.latitude + dLat(distanceM - half), longitude: observer.longitude - dLon(half) },
    { latitude: observer.latitude + dLat(distanceM - half), longitude: observer.longitude + dLon(half) },
    { latitude: observer.latitude + dLat(distanceM + half), longitude: observer.longitude + dLon(half) },
    { latitude: observer.latitude + dLat(distanceM + half), longitude: observer.longitude - dLon(half) },
  ];
}

describe("toLocalMeters", () => {
  it("puts the observer at the origin", () => {
    const here = toLocalMeters(OBSERVER, OBSERVER);
    expect(here.east).toBeCloseTo(0, 6);
    expect(here.north).toBeCloseTo(0, 6);
  });

  it("measures north and east in metres", () => {
    const hundredNorth = {
      latitude: OBSERVER.latitude + 100 / M_PER_DEG_LAT,
      longitude: OBSERVER.longitude,
    };
    const local = toLocalMeters(OBSERVER, hundredNorth);
    expect(local.north).toBeCloseTo(100, 1);
    expect(local.east).toBeCloseTo(0, 6);
  });
});

describe("localBearingDeg", () => {
  it("reads the cardinal directions correctly", () => {
    const north = { latitude: OBSERVER.latitude + 0.001, longitude: OBSERVER.longitude };
    const east = { latitude: OBSERVER.latitude, longitude: OBSERVER.longitude + 0.001 };
    const south = { latitude: OBSERVER.latitude - 0.001, longitude: OBSERVER.longitude };

    expect(localBearingDeg(OBSERVER, north)).toBeCloseTo(0, 1);
    expect(localBearingDeg(OBSERVER, east)).toBeCloseTo(90, 1);
    expect(localBearingDeg(OBSERVER, south)).toBeCloseTo(180, 1);
  });
});

describe("angularExtent", () => {
  it("matches the angle a building of known size subtends", () => {
    // Set by the nearest corners, not the centroid: a 25m square centred
    // 100m away has its near face at 87.5m, so it spans
    // 2*atan(12.5/87.5) = 16.26 degrees, wider than the 14.25 you would get
    // from measuring at the centre.
    const extent = angularExtent(OBSERVER, 0, squareNorthOf(100, 25));
    expect(extent.spanDeg).toBeCloseTo(16.26, 0);
  });

  it("shrinks with distance", () => {
    const near = angularExtent(OBSERVER, 0, squareNorthOf(100, 25));
    const far = angularExtent(OBSERVER, 0, squareNorthOf(400, 25));
    expect(near.spanDeg).toBeGreaterThan(far.spanDeg);
  });

  it("brackets the ray when the ray hits the centre", () => {
    const extent = angularExtent(OBSERVER, 0, squareNorthOf(100, 25));
    expect(extent.minDeltaDeg).toBeLessThan(0);
    expect(extent.maxDeltaDeg).toBeGreaterThan(0);
    expect(extent.minDeltaDeg).toBeCloseTo(-extent.maxDeltaDeg, 1);
  });

  it("reports both bounds on one side when the ray misses to the side", () => {
    // Aiming well to the right of a building leaves it entirely anticlockwise.
    const extent = angularExtent(OBSERVER, 40, squareNorthOf(100, 25));
    expect(extent.maxDeltaDeg).toBeLessThan(0);
  });

  it("does not blow up on a building straddling due north", () => {
    // The wrap case: absolute bearings here run either side of 0/360, which
    // a naive min and max would read as a building 350 degrees wide.
    const extent = angularExtent(OBSERVER, 0, squareNorthOf(60, 40));
    expect(extent.spanDeg).toBeLessThan(90);
    expect(extent.spanDeg).toBeGreaterThan(0);
  });
});

describe("identificationConfidence", () => {
  it("is high for a wide building at close range", () => {
    const extent = angularExtent(OBSERVER, 0, squareNorthOf(100, 40));
    expect(identificationConfidence(extent, 3)).toBeGreaterThan(0.95);
  });

  it("is low for a narrow building far away", () => {
    const extent = angularExtent(OBSERVER, 0, squareNorthOf(1000, 8));
    expect(identificationConfidence(extent, 3)).toBeLessThan(0.2);
  });

  it("falls as the same building gets further away", () => {
    const confidences = [100, 300, 800, 2000].map((d) =>
      identificationConfidence(angularExtent(OBSERVER, 0, squareNorthOf(d, 25)), 3)
    );
    for (let i = 1; i < confidences.length; i++) {
      expect(confidences[i]).toBeLessThan(confidences[i - 1]);
    }
  });

  it("rises as the compass gets more accurate", () => {
    const extent = angularExtent(OBSERVER, 0, squareNorthOf(400, 25));
    const sloppy = identificationConfidence(extent, 8);
    const good = identificationConfidence(extent, 3);
    const excellent = identificationConfidence(extent, 1);

    expect(good).toBeGreaterThan(sloppy);
    expect(excellent).toBeGreaterThan(good);
  });

  it("drops when the ray lands near an edge rather than the middle", () => {
    const polygon = squareNorthOf(200, 40);
    const centred = identificationConfidence(angularExtent(OBSERVER, 0, polygon), 3);

    // 40m wide at 200m spans ~11.4 degrees, so 5 degrees off-centre puts the
    // ray close to the edge and the neighbouring building becomes plausible.
    const offCentre = identificationConfidence(
      angularExtent(OBSERVER, 5, polygon),
      3
    );

    expect(offCentre).toBeLessThan(centred);
  });

  it("always returns a usable probability", () => {
    for (const distance of [10, 100, 1000, 5000]) {
      for (const accuracy of [0, 1, 5, 30]) {
        const value = identificationConfidence(
          angularExtent(OBSERVER, 0, squareNorthOf(distance, 25)),
          accuracy
        );
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });
});

describe("rayPolygonDistance", () => {
  it("finds the near face of a building dead ahead", () => {
    // Near edge of a 25m square centred 100m north sits at 87.5m.
    const distance = rayPolygonDistance(OBSERVER, 0, squareNorthOf(100, 25));
    expect(distance).not.toBeNull();
    expect(distance as number).toBeCloseTo(87.5, 0);
  });

  it("returns null when the ray misses", () => {
    expect(rayPolygonDistance(OBSERVER, 90, squareNorthOf(100, 25))).toBeNull();
  });

  it("returns null for a ray pointing away from the building", () => {
    expect(rayPolygonDistance(OBSERVER, 180, squareNorthOf(100, 25))).toBeNull();
  });

  it("returns zero when standing inside the footprint", () => {
    expect(rayPolygonDistance(OBSERVER, 0, squareNorthOf(0, 50))).toBe(0);
  });

  it("reports the nearer of two buildings on the same bearing", () => {
    const near = rayPolygonDistance(OBSERVER, 0, squareNorthOf(100, 25)) as number;
    const far = rayPolygonDistance(OBSERVER, 0, squareNorthOf(300, 25)) as number;
    expect(near).toBeLessThan(far);
  });

  it("ignores a degenerate footprint", () => {
    expect(rayPolygonDistance(OBSERVER, 0, [])).toBeNull();
    expect(rayPolygonDistance(OBSERVER, 0, [OBSERVER, OBSERVER])).toBeNull();
  });
});
