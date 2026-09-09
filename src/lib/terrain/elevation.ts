import { destinationPoint } from "@/lib/geo/haversine";
import type { Coordinates } from "@/types/geo";

import {
  DEFAULT_ZOOM,
  decodeElevation,
  TileCache,
  type DecodedTile,
} from "./terrainTiles";
import { lonLatToTilePixel, TILE_SIZE, type TileId } from "./tileMath";
import type { ElevationSource } from "./types";

/** Extra tiles fetched around the corridor to cover bilinear edge reads. */
const CORRIDOR_PADDING_TILES = 1;

/** How many points along the ray are used to bound the corridor. */
const CORRIDOR_SAMPLES = 12;

/**
 * Terrain elevation backed by terrarium tiles.
 *
 * Tiles are fetched up front for the whole ray corridor so that `sample` is
 * synchronous. That is what lets the ray marcher stay a pure function with
 * no awaits inside its loop, and therefore stay unit-testable.
 */
export class TerrainElevationSource implements ElevationSource {
  constructor(
    private readonly cache: TileCache = new TileCache(),
    private readonly zoom: number = DEFAULT_ZOOM
  ) {}

  /** Fetches every tile the ray can touch. Call before marching. */
  async prefetchCorridor(
    origin: Coordinates,
    bearingDeg: number,
    maxDistanceMeters: number
  ): Promise<void> {
    const points: Coordinates[] = [origin];
    for (let i = 1; i <= CORRIDOR_SAMPLES; i++) {
      points.push(
        destinationPoint(
          origin,
          bearingDeg,
          (maxDistanceMeters * i) / CORRIDOR_SAMPLES
        )
      );
    }

    await this.prefetchAround(points);
  }

  /** Fetches the tiles covering the given points, plus a ring of padding. */
  async prefetchAround(points: Coordinates[]): Promise<void> {
    const wanted = new Map<string, TileId>();

    for (const point of points) {
      const { tileX, tileY } = lonLatToTilePixel(point, this.zoom);
      for (let dx = -CORRIDOR_PADDING_TILES; dx <= CORRIDOR_PADDING_TILES; dx++) {
        for (let dy = -CORRIDOR_PADDING_TILES; dy <= CORRIDOR_PADDING_TILES; dy++) {
          const id: TileId = { z: this.zoom, x: tileX + dx, y: tileY + dy };
          wanted.set(`${id.z}/${id.x}/${id.y}`, id);
        }
      }
    }

    // A failed tile is a data gap, not a fatal error; sample() reports null
    // there and the marcher keeps searching.
    await Promise.all(
      [...wanted.values()].map((id) => this.cache.load(id).catch(() => null))
    );
  }

  sample(coords: Coordinates): number | null {
    const { tileX, tileY, pixelX, pixelY } = lonLatToTilePixel(
      coords,
      this.zoom
    );

    // Global pixel coordinates, shifted by half a pixel so that a stored
    // value is treated as the centre of its cell rather than its corner.
    const gx = tileX * TILE_SIZE + pixelX - 0.5;
    const gy = tileY * TILE_SIZE + pixelY - 0.5;

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;

    const v00 = this.elevationAtGlobalPixel(x0, y0);
    const v10 = this.elevationAtGlobalPixel(x0 + 1, y0);
    const v01 = this.elevationAtGlobalPixel(x0, y0 + 1);
    const v11 = this.elevationAtGlobalPixel(x0 + 1, y0 + 1);

    if (v00 === null || v10 === null || v01 === null || v11 === null) {
      // Fall back to the nearest available cell rather than dropping the
      // sample entirely at a tile edge.
      return v00 ?? v10 ?? v01 ?? v11;
    }

    const top = v00 + (v10 - v00) * fx;
    const bottom = v01 + (v11 - v01) * fx;
    return top + (bottom - top) * fy;
  }

  private elevationAtGlobalPixel(gx: number, gy: number): number | null {
    const tileX = Math.floor(gx / TILE_SIZE);
    const tileY = Math.floor(gy / TILE_SIZE);

    const tile = this.cache.get({ z: this.zoom, x: tileX, y: tileY });
    if (!tile) return null;

    const px = gx - tileX * TILE_SIZE;
    const py = gy - tileY * TILE_SIZE;

    return readTileElevation(tile, px, py);
  }
}

export function readTileElevation(
  tile: DecodedTile,
  pixelX: number,
  pixelY: number
): number {
  const x = Math.min(TILE_SIZE - 1, Math.max(0, pixelX));
  const y = Math.min(TILE_SIZE - 1, Math.max(0, pixelY));
  const index = (y * tile.width + x) * tile.channels;

  return decodeElevation(
    tile.data[index],
    tile.data[index + 1],
    tile.data[index + 2]
  );
}
