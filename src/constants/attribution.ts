/**
 * Single source of truth for the credits shown on the boot screen.
 *
 * Two of these are obligations rather than courtesies: OpenStreetMap data is
 * ODbL licensed and requires attribution, and the elevation sources expect
 * credit. Keeping them here means the boot screen and any future about
 * screen cannot drift apart.
 */

export interface AttributionEntry {
  role: string;
  credit: string;
}

export const ATTRIBUTIONS: AttributionEntry[] = [
  { role: "Map data", credit: "© OpenStreetMap contributors (ODbL)" },
  { role: "Vector tiles", credit: "OpenFreeMap" },
  { role: "Elevation", credit: "NASA SRTM · Copernicus DEM · Mapzen terrain tiles" },
  { role: "Maps", credit: "Apple Maps · Google Maps" },
  { role: "Built with", credit: "Expo · React Native" },
];

/**
 * Stated plainly because the visual design is borrowed. This is a fan
 * project; the Sheikah Slate is Nintendo's design, not ours.
 */
export const DISCLAIMER =
  "An unofficial fan project inspired by The Legend of Zelda: Breath of the Wild. Not affiliated with or endorsed by Nintendo.";

export const APP_TAGLINE = "Know what you are looking at.";
