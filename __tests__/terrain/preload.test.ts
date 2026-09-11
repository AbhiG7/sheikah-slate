import { PRELOAD_RADIUS_M, tilesAround } from "@/lib/terrain/preload";
import { lonLatToTilePixel } from "@/lib/terrain/tileMath";

const SEATTLE = { latitude: 47.6062, longitude: -122.3321 };
const QUITO = { latitude: -0.1807, longitude: -78.4678 };

describe("tilesAround", () => {
  it("covers the tile the centre itself sits in", () => {
    const centre = lonLatToTilePixel(SEATTLE, 12);
    const tiles = tilesAround(SEATTLE, PRELOAD_RADIUS_M);

    expect(
      tiles.some((t) => t.x === centre.tileX && t.y === centre.tileY)
    ).toBe(true);
  });

  it("stays a manageable download at the ten mile default", () => {
    // The whole point of a flat radius: small enough not to need a
    // city-versus-country rule for terrain.
    const tiles = tilesAround(SEATTLE, PRELOAD_RADIUS_M);
    expect(tiles.length).toBeGreaterThan(9);
    expect(tiles.length).toBeLessThan(64);
  });

  it("grows with the radius", () => {
    const small = tilesAround(SEATTLE, 4000);
    const large = tilesAround(SEATTLE, 20_000);
    expect(large.length).toBeGreaterThan(small.length);
  });

  it("returns no duplicate tiles", () => {
    const tiles = tilesAround(SEATTLE, PRELOAD_RADIUS_M);
    const keys = new Set(tiles.map((t) => `${t.z}/${t.x}/${t.y}`));
    expect(keys.size).toBe(tiles.length);
  });

  it("needs more tiles at high latitude for the same metric radius", () => {
    // A Mercator tile spans a fixed number of longitude degrees, so in
    // metres it narrows by cos(latitude): about 6.6km wide in Seattle
    // against 9.8km at the equator. The same radius therefore costs more
    // tiles the further from the equator you are.
    const equator = tilesAround(QUITO, PRELOAD_RADIUS_M);
    const high = tilesAround(SEATTLE, PRELOAD_RADIUS_M);
    expect(high.length).toBeGreaterThan(equator.length);
  });

  it("requests every tile at the same zoom", () => {
    const tiles = tilesAround(SEATTLE, PRELOAD_RADIUS_M);
    expect(new Set(tiles.map((t) => t.z)).size).toBe(1);
  });
});
