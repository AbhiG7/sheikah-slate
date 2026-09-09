import type { Coordinates } from "@/types/geo";

export const TILE_SIZE = 256;

export interface TilePixel {
  tileX: number;
  tileY: number;
  /** Fractional pixel position within the tile, range [0, TILE_SIZE). */
  pixelX: number;
  pixelY: number;
}

export interface TileId {
  z: number;
  x: number;
  y: number;
}

/**
 * Web Mercator projection to a global pixel coordinate at the given zoom.
 * Working in global pixels first keeps the tile/pixel split trivial and
 * avoids repeating the projection in both directions.
 */
function toGlobalPixel(
  { latitude, longitude }: Coordinates,
  zoom: number
): { gx: number; gy: number } {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const latRad = (latitude * Math.PI) / 180;

  const gx = ((longitude + 180) / 360) * worldSize;
  const gy = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * worldSize;

  return { gx, gy };
}

export function lonLatToTilePixel(
  coords: Coordinates,
  zoom: number
): TilePixel {
  const { gx, gy } = toGlobalPixel(coords, zoom);

  const tileX = Math.floor(gx / TILE_SIZE);
  const tileY = Math.floor(gy / TILE_SIZE);

  return {
    tileX,
    tileY,
    pixelX: gx - tileX * TILE_SIZE,
    pixelY: gy - tileY * TILE_SIZE,
  };
}

export function tilePixelToLonLat(
  tileX: number,
  tileY: number,
  pixelX: number,
  pixelY: number,
  zoom: number
): Coordinates {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const gx = tileX * TILE_SIZE + pixelX;
  const gy = tileY * TILE_SIZE + pixelY;

  const longitude = (gx / worldSize) * 360 - 180;
  const latitude =
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * gy) / worldSize))) * 180) /
    Math.PI;

  return { latitude, longitude };
}

/**
 * Ground resolution in metres per pixel. Mercator stretches with latitude,
 * so this shrinks as you move away from the equator.
 */
export function metresPerPixel(latitude: number, zoom: number): number {
  const EQUATOR_M = 40_075_016.686;
  return (
    (EQUATOR_M * Math.cos((latitude * Math.PI) / 180)) /
    (TILE_SIZE * 2 ** zoom)
  );
}

/** Every tile covering the given lat/lon bounding box, inclusive. */
export function tilesForBounds(
  bounds: { north: number; south: number; east: number; west: number },
  zoom: number
): TileId[] {
  const topLeft = lonLatToTilePixel(
    { latitude: bounds.north, longitude: bounds.west },
    zoom
  );
  const bottomRight = lonLatToTilePixel(
    { latitude: bounds.south, longitude: bounds.east },
    zoom
  );

  const tiles: TileId[] = [];
  for (let x = topLeft.tileX; x <= bottomRight.tileX; x++) {
    for (let y = topLeft.tileY; y <= bottomRight.tileY; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }
  return tiles;
}
