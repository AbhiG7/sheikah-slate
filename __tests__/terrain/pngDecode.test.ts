import { readFileSync } from "fs";
import { join } from "path";

import { PNG } from "pngjs";

import { decodePng } from "@/lib/terrain/pngDecode";

const FIXTURE_BYTES = readFileSync(
  join(__dirname, "../fixtures/terrarium-12-662-1443.png")
);

describe("decodePng", () => {
  it("reads the header of a real terrarium tile", () => {
    const img = decodePng(new Uint8Array(FIXTURE_BYTES));
    expect(img.width).toBe(256);
    expect(img.height).toBe(256);
    expect(img.channels).toBe(3);
    expect(img.data.length).toBe(256 * 256 * 3);
  });

  it("matches a reference decoder pixel for pixel", () => {
    // pngjs is a mature, independent implementation. It relies on Node's zlib
    // so it cannot ship in the app, but it is a rigorous oracle here: any
    // mistake in chunk parsing or scanline unfiltering shows up immediately.
    const mine = decodePng(new Uint8Array(FIXTURE_BYTES));
    const reference = PNG.sync.read(FIXTURE_BYTES);

    expect(reference.width).toBe(mine.width);
    expect(reference.height).toBe(mine.height);

    let compared = 0;
    for (let i = 0; i < mine.width * mine.height; i++) {
      const mineAt = i * mine.channels;
      const refAt = i * 4; // pngjs always expands to RGBA

      expect(mine.data[mineAt]).toBe(reference.data[refAt]);
      expect(mine.data[mineAt + 1]).toBe(reference.data[refAt + 1]);
      expect(mine.data[mineAt + 2]).toBe(reference.data[refAt + 2]);
      compared++;
    }

    expect(compared).toBe(256 * 256);
  });

  it("rejects data that is not a PNG", () => {
    expect(() => decodePng(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow(
      /not a png/i
    );
  });
});
