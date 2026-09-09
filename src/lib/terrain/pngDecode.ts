import { unzlibSync } from "fflate";

/**
 * Minimal PNG decoder for terrain tiles.
 *
 * Terrarium tiles are always 8-bit non-interlaced RGB at a fixed size, so
 * this handles exactly that narrow case. It exists because the general-purpose
 * decoders are a poor fit for this runtime: they ship ESM that Metro and Jest
 * must be specially configured for, and they call `new TextDecoder("latin1")`,
 * which Expo's TextDecoder polyfill does not support. fflate is CommonJS,
 * pure JS, and needs no text decoding at all.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export interface DecodedPng {
  width: number;
  height: number;
  /** 3 for RGB, 4 for RGBA. */
  channels: number;
  data: Uint8Array;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function chunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3]
  );
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function decodePng(bytes: Uint8Array): DecodedPng {
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error("Not a PNG file");
    }
  }

  let width = 0;
  let height = 0;
  let channels = 0;
  const idatParts: Uint8Array[] = [];

  let offset = PNG_SIGNATURE.length;
  while (offset < bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    const dataStart = offset + 8;

    if (type === "IHDR") {
      width = readUint32BE(bytes, dataStart);
      height = readUint32BE(bytes, dataStart + 4);
      const bitDepth = bytes[dataStart + 8];
      const colorType = bytes[dataStart + 9];
      const interlace = bytes[dataStart + 12];

      if (bitDepth !== 8) {
        throw new Error(`Unsupported PNG bit depth ${bitDepth}, expected 8`);
      }
      if (interlace !== 0) {
        throw new Error("Interlaced PNG is not supported");
      }
      if (colorType === 2) channels = 3;
      else if (colorType === 6) channels = 4;
      else throw new Error(`Unsupported PNG colour type ${colorType}`);
    } else if (type === "IDAT") {
      idatParts.push(bytes.subarray(dataStart, dataStart + length));
    } else if (type === "IEND") {
      break;
    }

    // length + type + data + crc
    offset = dataStart + length + 4;
  }

  if (!width || !height || !channels) {
    throw new Error("PNG missing IHDR");
  }

  const compressed = concat(idatParts);
  const raw = unzlibSync(compressed);

  return {
    width,
    height,
    channels,
    data: unfilter(raw, width, height, channels),
  };
}

function concat(parts: Uint8Array[]): Uint8Array {
  if (parts.length === 1) return parts[0];
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/**
 * Reverses the per-scanline filters defined by the PNG spec. Each row is
 * prefixed with a filter byte and is reconstructed from the bytes to its
 * left (a), above (b), and above-left (c).
 */
function unfilter(
  raw: Uint8Array,
  width: number,
  height: number,
  channels: number
): Uint8Array {
  const stride = width * channels;
  const out = new Uint8Array(stride * height);

  let pos = 0;
  for (let row = 0; row < height; row++) {
    const filter = raw[pos++];
    const rowStart = row * stride;
    const prevStart = rowStart - stride;

    for (let i = 0; i < stride; i++) {
      const value = raw[pos + i];
      const a = i >= channels ? out[rowStart + i - channels] : 0;
      const b = row > 0 ? out[prevStart + i] : 0;
      const c = row > 0 && i >= channels ? out[prevStart + i - channels] : 0;

      let recon: number;
      switch (filter) {
        case 0:
          recon = value;
          break;
        case 1:
          recon = value + a;
          break;
        case 2:
          recon = value + b;
          break;
        case 3:
          recon = value + ((a + b) >> 1);
          break;
        case 4:
          recon = value + paethPredictor(a, b, c);
          break;
        default:
          throw new Error(`Unknown PNG filter type ${filter}`);
      }

      out[rowStart + i] = recon & 0xff;
    }

    pos += stride;
  }

  return out;
}
