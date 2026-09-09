import { GravityFilter, pitchFromGravity } from "@/lib/terrain/attitude";

// Gravity as reported in device coordinates, using the convention where a
// phone lying flat with its screen up reads -1 on Z.
const UPRIGHT = { x: 0, y: -1, z: 0 };
const FLAT_SCREEN_UP = { x: 0, y: 0, z: -1 };
const FLAT_SCREEN_DOWN = { x: 0, y: 0, z: 1 };

describe("pitchFromGravity", () => {
  it("reads level when the phone is held upright", () => {
    expect(pitchFromGravity(UPRIGHT)).toBeCloseTo(0, 6);
  });

  it("reads straight down when the phone lies screen-up", () => {
    expect(pitchFromGravity(FLAT_SCREEN_UP)).toBeCloseTo(-90, 6);
  });

  it("reads straight up when the phone lies screen-down", () => {
    expect(pitchFromGravity(FLAT_SCREEN_DOWN)).toBeCloseTo(90, 6);
  });

  it("is unaffected by roll, which is the whole point", () => {
    // Same upright pitch, but rolled 90 degrees into landscape: gravity moves
    // from the Y axis to the X axis while Z stays 0.
    const portrait = pitchFromGravity({ x: 0, y: -1, z: 0 });
    const landscape = pitchFromGravity({ x: -1, y: 0, z: 0 });
    expect(landscape).toBeCloseTo(portrait, 6);
  });

  it("handles unnormalised readings in m/s^2", () => {
    expect(pitchFromGravity({ x: 0, y: -9.81, z: 0 })).toBeCloseTo(0, 6);
    expect(pitchFromGravity({ x: 0, y: 0, z: -9.81 })).toBeCloseTo(-90, 6);
  });

  it("reports 45 degrees up when tilted halfway", () => {
    const s = Math.SQRT1_2;
    expect(pitchFromGravity({ x: 0, y: -s, z: s })).toBeCloseTo(45, 4);
  });

  it("can flip sign for platforms that invert the axis", () => {
    expect(pitchFromGravity(FLAT_SCREEN_UP, -1)).toBeCloseTo(90, 6);
  });

  it("returns 0 rather than NaN for a zero reading", () => {
    expect(pitchFromGravity({ x: 0, y: 0, z: 0 })).toBe(0);
  });
});

describe("GravityFilter", () => {
  it("adopts the first sample immediately", () => {
    const filter = new GravityFilter(0.1);
    expect(filter.next({ x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("converges on a steady reading", () => {
    const filter = new GravityFilter(0.2);
    filter.next({ x: 0, y: 0, z: 0 });
    for (let i = 0; i < 200; i++) filter.next({ x: 0, y: -9.81, z: 0 });

    const settled = filter.next({ x: 0, y: -9.81, z: 0 });
    expect(settled.y).toBeCloseTo(-9.81, 3);
  });

  it("suppresses a transient shake", () => {
    const filter = new GravityFilter(0.1);
    filter.next({ x: 0, y: -9.81, z: 0 });
    for (let i = 0; i < 50; i++) filter.next({ x: 0, y: -9.81, z: 0 });

    // One violent spike should barely move the estimate.
    const jolted = filter.next({ x: 20, y: -9.81, z: 0 });
    expect(Math.abs(jolted.x)).toBeLessThan(3);
  });
});
