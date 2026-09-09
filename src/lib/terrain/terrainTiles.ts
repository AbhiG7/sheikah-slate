import { decodePng } from "./pngDecode";
import type { TileId } from "./tileMath";
import { TILE_SIZE } from "./tileMath";

/**
 * AWS-hosted Mapzen terrarium tiles: a global ~30m SRTM/Copernicus blend,
 * free and keyless. Verified against Mount Rainier, which decodes to 4388m
 * versus a surveyed 4392m.
 */
const TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";

export const DEFAULT_ZOOM = 12;

/** Beyond this the source data has no more detail to give. */
export const MAX_USEFUL_ZOOM = 13;

export interface DecodedTile {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array;
}

export function tileKey({ z, x, y }: TileId): string {
  return `${z}/${x}/${y}`;
}

export function tileUrl({ z, x, y }: TileId): string {
  return `${TILE_URL}/${z}/${x}/${y}.png`;
}

/**
 * Terrarium encodes elevation across the RGB channels with a 32768m offset,
 * giving 1/256 m precision over the full range of terrestrial elevations.
 */
export function decodeElevation(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

export async function fetchTile(id: TileId): Promise<DecodedTile> {
  const response = await fetch(tileUrl(id));
  if (!response.ok) {
    throw new Error(`Terrain tile ${tileKey(id)} failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const image = decodePng(new Uint8Array(buffer));

  if (image.width !== TILE_SIZE || image.height !== TILE_SIZE) {
    throw new Error(
      `Unexpected tile size ${image.width}x${image.height} for ${tileKey(id)}`
    );
  }

  return {
    width: image.width,
    height: image.height,
    // Terrarium tiles decode as 3-channel RGB, not RGBA. Assuming 4 here
    // would silently read the wrong bytes for every sample.
    channels: image.channels,
    data: image.data,
  };
}

/**
 * Bounded in-memory tile cache. A 30km corridor touches only a handful of
 * tiles, so a small cache covers repeated identifications from one spot.
 */
export class TileCache {
  private readonly tiles = new Map<string, DecodedTile>();
  private readonly inFlight = new Map<string, Promise<DecodedTile>>();

  constructor(
    private readonly capacity = 64,
    private readonly loader: (id: TileId) => Promise<DecodedTile> = fetchTile
  ) {}

  get(id: TileId): DecodedTile | undefined {
    const key = tileKey(id);
    const tile = this.tiles.get(key);
    if (tile) {
      // Refresh recency for LRU eviction.
      this.tiles.delete(key);
      this.tiles.set(key, tile);
    }
    return tile;
  }

  async load(id: TileId): Promise<DecodedTile> {
    const key = tileKey(id);

    const cached = this.tiles.get(key);
    if (cached) return cached;

    // Collapse concurrent requests for the same tile into one fetch.
    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const request = this.loader(id)
      .then((tile) => {
        this.put(key, tile);
        return tile;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, request);
    return request;
  }

  private put(key: string, tile: DecodedTile): void {
    this.tiles.set(key, tile);
    while (this.tiles.size > this.capacity) {
      const oldest = this.tiles.keys().next().value;
      if (oldest === undefined) break;
      this.tiles.delete(oldest);
    }
  }

  get size(): number {
    return this.tiles.size;
  }
}
