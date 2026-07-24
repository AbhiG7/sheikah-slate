import { CameraView } from "expo-camera";
import { StyleSheet } from "react-native";

/**
 * Fullscreen camera feed. Zoom is pinned at 0 and no pinch gesture is
 * wired up, since the FOV calibration in settings assumes an unzoomed
 * wide lens — letting zoom drift would silently invalidate it.
 */
export function CameraPassthrough() {
  return <CameraView style={StyleSheet.absoluteFill} facing="back" zoom={0} />;
}
