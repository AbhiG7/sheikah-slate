import { Platform } from "react-native";

export const EARTH_RADIUS_M = 6_371_000;

// expo-camera does not expose true optical FOV, so these are approximate
// defaults for the main wide-angle lens, refined per-device via the
// calibration flow in settings and persisted as an effective FOV.
export const DEFAULT_HORIZONTAL_FOV_DEG = Platform.select({
  ios: 68,
  android: 70,
  default: 68,
});

export const DEFAULT_VERTICAL_FOV_DEG = Platform.select({
  ios: 41,
  android: 43,
  default: 41,
});

export const MAX_RENDER_DISTANCE_M = 50_000;

/**
 * Height of a pin's beam as a real-world pillar, in metres.
 *
 * Deliberately enormous, like the game's beams, rather than a plausible
 * physical object. The height sets the range over which perspective is
 * actually visible: a 120m pillar is already at the minimum screen size by
 * 1.5km, so every beam in this app's 5-10 mile range would render
 * identically and the perspective work would be invisible. A kilometre-tall
 * pillar keeps beams shrinking meaningfully all the way out to ~12km, and
 * towers dramatically off the top of the frame up close.
 */
export const BEAM_WORLD_HEIGHT_M = 1000;

/**
 * A beam never draws shorter than this. Pure perspective is the honest
 * answer, but past a point the pillar subtends too little to find at all.
 */
export const MIN_BEAM_SCREEN_PX = 46;
