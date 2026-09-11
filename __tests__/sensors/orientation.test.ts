import {
  cameraBasis,
  cameraOrientation,
  directionFromBearing,
  dot,
} from "@/lib/sensors/orientation";

/** Device angles for holding the phone upright, camera on the horizon. */
const UPRIGHT_BETA = 90;

describe("cameraOrientation", () => {
  it("points straight down when the phone lies flat, screen up", () => {
    const { pitchDeg } = cameraOrientation(0, 0, 0);
    expect(pitchDeg).toBeCloseTo(-90, 4);
  });

  it("points at the horizon when held upright", () => {
    const { pitchDeg } = cameraOrientation(0, UPRIGHT_BETA, 0);
    expect(pitchDeg).toBeCloseTo(0, 4);
  });

  it("converts anticlockwise alpha into a clockwise compass bearing", () => {
    // alpha runs anticlockwise, so turning the device +90 in alpha swings
    // the camera to the west, which is 270 on a compass.
    expect(cameraOrientation(0, UPRIGHT_BETA, 0).headingDeg).toBeCloseTo(0, 3);
    expect(cameraOrientation(90, UPRIGHT_BETA, 0).headingDeg).toBeCloseTo(270, 3);
    expect(cameraOrientation(180, UPRIGHT_BETA, 0).headingDeg).toBeCloseTo(180, 3);
    expect(cameraOrientation(270, UPRIGHT_BETA, 0).headingDeg).toBeCloseTo(90, 3);
  });

  it("tilts up and down with beta", () => {
    expect(cameraOrientation(0, UPRIGHT_BETA + 30, 0).pitchDeg).toBeCloseTo(30, 3);
    expect(cameraOrientation(0, UPRIGHT_BETA - 30, 0).pitchDeg).toBeCloseTo(-30, 3);
  });

  it("always returns a unit forward vector", () => {
    for (const [a, b, g] of [
      [0, 0, 0],
      [37, 12, -80],
      [200, 90, 45],
      [359, 140, 179],
    ]) {
      const { forward } = cameraOrientation(a, b, g);
      const length = Math.sqrt(forward.x ** 2 + forward.y ** 2 + forward.z ** 2);
      expect(length).toBeCloseTo(1, 6);
    }
  });

  it("keeps heading in [0, 360) at every attitude", () => {
    for (let alpha = 0; alpha < 360; alpha += 23) {
      const { headingDeg } = cameraOrientation(alpha, UPRIGHT_BETA, 0);
      expect(headingDeg).toBeGreaterThanOrEqual(0);
      expect(headingDeg).toBeLessThan(360);
    }
  });

  it("stays well defined where reading a single Euler angle breaks down", () => {
    // At beta = 90 the alpha and gamma rotations act about the same world
    // axis, so heading taken from alpha alone is degenerate. The forward
    // vector remains a unit vector with a finite heading regardless.
    for (const gamma of [-90, -45, 0, 45, 90]) {
      const { forward, headingDeg, pitchDeg } = cameraOrientation(
        0,
        UPRIGHT_BETA,
        gamma
      );
      const length = Math.sqrt(forward.x ** 2 + forward.y ** 2 + forward.z ** 2);
      expect(length).toBeCloseTo(1, 6);
      expect(Number.isFinite(headingDeg)).toBe(true);
      expect(Number.isFinite(pitchDeg)).toBe(true);
    }
  });
});

describe("directionFromBearing", () => {
  it("maps the cardinal directions onto east-north-up", () => {
    const north = directionFromBearing(0, 0);
    expect(north.y).toBeCloseTo(1, 6);
    expect(north.x).toBeCloseTo(0, 6);

    const east = directionFromBearing(90, 0);
    expect(east.x).toBeCloseTo(1, 6);
    expect(east.y).toBeCloseTo(0, 6);

    const west = directionFromBearing(270, 0);
    expect(west.x).toBeCloseTo(-1, 6);
  });

  it("raises the vector with elevation", () => {
    expect(directionFromBearing(0, 90).z).toBeCloseTo(1, 6);
    expect(directionFromBearing(0, -90).z).toBeCloseTo(-1, 6);
  });

  it("round-trips through cameraOrientation", () => {
    // A direction built from a bearing, then read back as a camera facing
    // that way, must report the same bearing.
    for (const bearing of [0, 45, 137, 270, 350]) {
      const target = directionFromBearing(bearing, 0);
      const readBack = (Math.atan2(target.x, target.y) * 180) / Math.PI;
      expect((readBack + 360) % 360).toBeCloseTo(bearing, 4);
    }
  });
});

describe("cameraBasis", () => {
  it("returns three mutually perpendicular unit vectors", () => {
    const basis = cameraBasis(37, 80, 15, 90);
    for (const v of [basis.forward, basis.right, basis.up]) {
      expect(Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)).toBeCloseTo(1, 6);
    }
    expect(dot(basis.right, basis.up)).toBeCloseTo(0, 6);
  });

  it("leaves the camera direction untouched by screen rotation", () => {
    // The lens is fixed to the chassis, so rotating the display cannot
    // change where it looks.
    const portrait = cameraBasis(45, 80, 0, 0);
    const landscape = cameraBasis(45, 80, 0, 90);
    expect(landscape.forward.x).toBeCloseTo(portrait.forward.x, 9);
    expect(landscape.forward.y).toBeCloseTo(portrait.forward.y, 9);
    expect(landscape.forward.z).toBeCloseTo(portrait.forward.z, 9);
  });

  it("swaps which world axis is screen-right when rotated to landscape", () => {
    // This is the correction that was missing entirely, and is why a
    // landscape-locked app placed beams about 90 degrees off.
    const portrait = cameraBasis(0, 90, 0, 0);
    const landscape = cameraBasis(0, 90, 0, 90);
    const agreement = dot(portrait.right, landscape.right);
    expect(Math.abs(agreement)).toBeLessThan(0.2);
  });
});
