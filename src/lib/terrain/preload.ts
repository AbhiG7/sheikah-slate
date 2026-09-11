import type { Coordinates } from "@/types/geo";

import { sharedTileCache } from "./identify";
import { DEFAULT_ZOOM } from "./terrainTiles";
import { lonLatToTilePixel, type TileId } from "./tileMath";

/**
 * How far around you terrain is fetched at startup.
 *
 * Flat rather than varying by city: at zoom 12 the whole disc is 36 tiles,
 * about 5 MB, and dropping to 5 miles would save only 16 tiles. That is not
 * worth carrying a city-detection mechanism for. Buildings will need the
 * opposite rule when they land, since a 5 mile building radius is ~67 MB in
 * a dense city and you cannot see past the next block anyway.
 */
export const PRELOAD_RADIUS_M = 16_093;

/** Rough metres per degree of latitude; longitude is scaled by latitude. */
const M_PER_DEG_LAT = 111_320;

export interface PreloadProgress {
  loaded: number;
  total: number;
}

/** Every tile covering a square that contains the radius around `centre`. */
export function tilesAround(
  centre: Coordinates,
  radiusMeters: number,
  zoom: number = DEFAULT_ZOOM
): TileId[] {
  const latSpan = radiusMeters / M_PER_DEG_LAT;
  const lonSpan =
    radiusMeters /
    (M_PER_DEG_LAT * Math.max(0.01, Math.cos((centre.latitude * Math.PI) / 180)));

  const northWest = lonLatToTilePixel(
    { latitude: centre.latitude + latSpan, longitude: centre.longitude - lonSpan },
    zoom
  );
  const southEast = lonLatToTilePixel(
    { latitude: centre.latitude - latSpan, longitude: centre.longitude + lonSpan },
    zoom
  );

  const tiles: TileId[] = [];
  for (let x = northWest.tileX; x <= southEast.tileX; x++) {
    for (let y = northWest.tileY; y <= southEast.tileY; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }
  return tiles;
}

/**
 * Warms the shared tile cache around a position.
 *
 * Fetches run a few at a time rather than all at once: a phone browser
 * opening 36 parallel requests starves the camera feed and the sensor
 * stream for the whole burst. Individual failures are swallowed, since a
 * missing tile is a data gap the ray marcher already handles.
 */
export async function preloadTerrainAround(
  centre: Coordinates,
  options: {
    radiusMeters?: number;
    concurrency?: number;
    onProgress?: (progress: PreloadProgress) => void;
    signal?: { cancelled: boolean };
  } = {}
): Promise<PreloadProgress> {
  const {
    radiusMeters = PRELOAD_RADIUS_M,
    concurrency = 4,
    onProgress,
    signal,
  } = options;

  const tiles = tilesAround(centre, radiusMeters);
  const total = tiles.length;
  let loaded = 0;

  for (let i = 0; i < tiles.length; i += concurrency) {
    if (signal?.cancelled) break;

    const batch = tiles.slice(i, i + concurrency);
    await Promise.all(
      batch.map((tile) =>
        sharedTileCache.load(tile).catch(() => null)
      )
    );

    loaded += batch.length;
    onProgress?.({ loaded, total });
  }

  return { loaded, total };
}
