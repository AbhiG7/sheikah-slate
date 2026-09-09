import { readFileSync } from "fs";
import { join } from "path";

import { TerrainElevationSource, readTileElevation } from "@/lib/terrain/elevation";
import { decodePng } from "@/lib/terrain/pngDecode";
import { marchRay } from "@/lib/terrain/rayMarch";
import {
  decodeElevation,
  TileCache,
  type DecodedTile,
} from "@/lib/terrain/terrainTiles";
import {
  lonLatToTilePixel,
  metresPerPixel,
  tilePixelToLonLat,
} from "@/lib/terrain/tileMath";

// Real terrarium tile z12/662/1443, covering Mount Rainier. Using a fixture
// keeps this hermetic while still exercising the true decode path.
const FIXTURE = decodePng(
  new Uint8Array(
    readFileSync(join(__dirname, "../fixtures/terrarium-12-662-1443.png"))
  )
);

const RAINIER = { latitude: 46.8523, longitude: -121.7603 };
const RAINIER_SURVEYED_M = 4392;

function fixtureCache(): TileCache {
  const tile: DecodedTile = {
    width: FIXTURE.width,
    height: FIXTURE.height,
    channels: FIXTURE.channels,
    data: FIXTURE.data,
  };
  // Serve the fixture for the tile it belongs to; anything else is a gap.
  return new TileCache(16, async (id) => {
    if (id.z === 12 && id.x === 662 && id.y === 1443) return tile;
    throw new Error("no data");
  });
}

describe("terrarium decoding", () => {
  it("decodes the documented encoding", () => {
    // 32768m offset across RGB: (128,0,0) is exactly sea level.
    expect(decodeElevation(128, 0, 0)).toBeCloseTo(0, 6);
    expect(decodeElevation(128, 100, 0)).toBeCloseTo(100, 6);
    expect(decodeElevation(127, 156, 0)).toBeCloseTo(-100, 6);
  });

  it("reads the tile as 3-channel RGB", () => {
    expect(FIXTURE.channels).toBe(3);
  });
});

describe("tile math", () => {
  it("places Mount Rainier in the expected tile", () => {
    const { tileX, tileY } = lonLatToTilePixel(RAINIER, 12);
    expect(tileX).toBe(662);
    expect(tileY).toBe(1443);
  });

  it("round-trips coordinates through tile space", () => {
    const { tileX, tileY, pixelX, pixelY } = lonLatToTilePixel(RAINIER, 12);
    const back = tilePixelToLonLat(tileX, tileY, pixelX, pixelY, 12);
    expect(back.latitude).toBeCloseTo(RAINIER.latitude, 6);
    expect(back.longitude).toBeCloseTo(RAINIER.longitude, 6);
  });

  it("reports ground resolution matching the ~30m source data", () => {
    const res = metresPerPixel(RAINIER.latitude, 12);
    expect(res).toBeGreaterThan(20);
    expect(res).toBeLessThan(35);
  });
});

describe("TerrainElevationSource against real data", () => {
  it("samples Mount Rainier within tolerance of the surveyed height", async () => {
    const source = new TerrainElevationSource(fixtureCache(), 12);
    await source.prefetchAround([RAINIER]);

    const elevation = source.sample(RAINIER);
    expect(elevation).not.toBeNull();
    // 30m DEM cells and bilinear smoothing put us a few metres low at a peak.
    expect(Math.abs((elevation as number) - RAINIER_SURVEYED_M)).toBeLessThan(60);
  });

  it("interpolates between cells instead of snapping to one", async () => {
    const source = new TerrainElevationSource(fixtureCache(), 12);
    await source.prefetchAround([RAINIER]);

    // Two points ~11m apart, well inside this tile (lat 46.819..46.865).
    // A cell is ~26m here, so nearest-neighbour sampling would return the
    // identical value; differing results prove interpolation is happening.
    const a = source.sample({ latitude: 46.84, longitude: -121.78 });
    const b = source.sample({ latitude: 46.8401, longitude: -121.78 });
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a).not.toBe(b);
  });

  it("returns null where no tile is loaded", async () => {
    const source = new TerrainElevationSource(fixtureCache(), 12);
    await source.prefetchAround([RAINIER]);

    expect(source.sample({ latitude: 0, longitude: 0 })).toBeNull();
  });

  it("reads a known pixel directly", () => {
    const tile: DecodedTile = {
      width: FIXTURE.width,
      height: FIXTURE.height,
      channels: FIXTURE.channels,
      data: FIXTURE.data,
    };
    const value = readTileElevation(tile, 128, 128);
    // Anywhere in this tile is Cascade terrain, well above sea level.
    expect(value).toBeGreaterThan(500);
    expect(value).toBeLessThan(4500);
  });
});

describe("full stack: march a real ray against real terrain", () => {
  it("hits the mountainside when aimed downslope from the summit", async () => {
    const source = new TerrainElevationSource(fixtureCache(), 12);
    await source.prefetchCorridor(RAINIER, 180, 5000);

    const result = marchRay(source, {
      origin: RAINIER,
      observerAltitudeMeters: RAINIER_SURVEYED_M + 2,
      bearingDeg: 180,
      pitchDeg: -30,
      maxDistanceMeters: 5000,
    });

    expect(result.kind).toBe("terrain");
    if (result.kind !== "terrain") return;

    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.distanceMeters).toBeLessThan(5000);
    // The hit must land on the mountain, below where we are standing.
    expect(result.elevationMeters).toBeLessThan(RAINIER_SURVEYED_M);
    expect(result.elevationMeters).toBeGreaterThan(1000);
  });

  it("reports sky when aimed above the summit", async () => {
    const source = new TerrainElevationSource(fixtureCache(), 12);
    await source.prefetchCorridor(RAINIER, 180, 5000);

    const result = marchRay(source, {
      origin: RAINIER,
      observerAltitudeMeters: RAINIER_SURVEYED_M + 2,
      bearingDeg: 180,
      pitchDeg: 25,
      maxDistanceMeters: 5000,
    });

    expect(result.kind).toBe("sky");
  });
});
