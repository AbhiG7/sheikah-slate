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
