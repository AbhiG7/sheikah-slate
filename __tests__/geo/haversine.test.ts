import {
  destinationPoint,
  distanceMeters,
  initialBearingDeg,
} from "@/lib/geo/haversine";

// Known reference pair: London (Trafalgar Sq.) -> Paris (Eiffel Tower).
// Cross-checked against a standard geodesy calculator (movable-type.co.uk):
// distance ~343.5 km, initial bearing ~149deg.
const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const PARIS = { latitude: 48.8584, longitude: 2.2945 };

describe("distanceMeters", () => {
  it("returns 0 for identical coordinates", () => {
    expect(distanceMeters(LONDON, LONDON)).toBeCloseTo(0, 6);
  });

  it("matches a known reference distance within 1%", () => {
    const d = distanceMeters(LONDON, PARIS);
    expect(d).toBeGreaterThan(340_000);
    expect(d).toBeLessThan(347_000);
  });

  it("is symmetric", () => {
    expect(distanceMeters(LONDON, PARIS)).toBeCloseTo(
      distanceMeters(PARIS, LONDON),
      6
    );
  });

  it("scales correctly for one degree of longitude at the equator (~111.2km)", () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 0, longitude: 1 };
    expect(distanceMeters(a, b)).toBeCloseTo(111_195, -3);
  });
});

describe("initialBearingDeg", () => {
  it("returns 0 for due north", () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 1, longitude: 0 };
    expect(initialBearingDeg(a, b)).toBeCloseTo(0, 1);
  });

  it("returns 90 for due east at the equator", () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 0, longitude: 1 };
    expect(initialBearingDeg(a, b)).toBeCloseTo(90, 1);
  });

  it("returns 180 for due south", () => {
    const a = { latitude: 1, longitude: 0 };
    const b = { latitude: 0, longitude: 0 };
    expect(initialBearingDeg(a, b)).toBeCloseTo(180, 1);
  });

  it("returns 270 for due west at the equator", () => {
    const a = { latitude: 0, longitude: 1 };
    const b = { latitude: 0, longitude: 0 };
    expect(initialBearingDeg(a, b)).toBeCloseTo(270, 1);
  });

  it("matches a known reference bearing within 1 degree", () => {
    expect(initialBearingDeg(LONDON, PARIS)).toBeCloseTo(149, 0);
  });

  it("always returns a value in [0, 360)", () => {
    const a = { latitude: 10, longitude: 10 };
    const b = { latitude: 5, longitude: -5 };
    const bearing = initialBearingDeg(a, b);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});

describe("destinationPoint", () => {
  it("is the inverse of distance + bearing for a round trip", () => {
    const origin = { latitude: 40.0, longitude: -74.0 };
    const bearing = 47;
    const distance = 12_345;

    const dest = destinationPoint(origin, bearing, distance);

    expect(distanceMeters(origin, dest)).toBeCloseTo(distance, -1);
    expect(initialBearingDeg(origin, dest)).toBeCloseTo(bearing, 1);
  });

  it("moving 0 meters returns the origin", () => {
    const origin = { latitude: 40.0, longitude: -74.0 };
    const dest = destinationPoint(origin, 90, 0);
    expect(dest.latitude).toBeCloseTo(origin.latitude, 9);
    expect(dest.longitude).toBeCloseTo(origin.longitude, 9);
  });
});
