import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import type { PinAnchor } from "@/hooks/usePinAnchors";

import { Beam } from "./Beam";

const DEG_TO_RAD = Math.PI / 180;
/** How close, in pixels, the pointer must be to count as on the beam. */
const FOCUS_RADIUS_PX = 26;

interface BeamOverlayProps {
  anchors: PinAnchor[];
  headingDeg: SharedValue<number>;
  pitchDeg: SharedValue<number>;
  screenWidth: number;
  screenHeight: number;
  horizontalFovDeg: number;
  verticalFovDeg: number;
  onFocusChange: (pinId: string | null) => void;
}

export function BeamOverlay({
  anchors,
  headingDeg,
  pitchDeg,
  screenWidth,
  screenHeight,
  horizontalFovDeg,
  verticalFovDeg,
  onFocusChange,
}: BeamOverlayProps) {
  // Mirrors the anchors onto the animation runtime so the focus worklet can
  // read them without touching React.
  const anchorData = useSharedValue<{ id: string; bearingDeg: number }[]>([]);
  const lastReported = useSharedValue<string | null>(null);

  useEffect(() => {
    anchorData.value = anchors.map((a) => ({
      id: a.pin.id,
      bearingDeg: a.bearingDeg,
    }));
  }, [anchors, anchorData]);

  /**
   * Picks whichever beam is under the pointer, evaluated on the same frame
   * loop as the beams themselves so it can never disagree with what is
   * drawn. Only a change in which pin is focused crosses back to React,
   * so holding the pointer steady on a beam costs nothing.
   */
  useDerivedValue(() => {
    const halfHorizontal = horizontalFovDeg / 2;
    const centre = screenWidth / 2;

    let nearestId: string | null = null;
    let nearestDistance = FOCUS_RADIUS_PX;

    for (const anchor of anchorData.value) {
      const relativeAngle =
        ((anchor.bearingDeg - headingDeg.value + 540) % 360) - 180;
      if (Math.abs(relativeAngle) > halfHorizontal) continue;

      const screenX =
        centre +
        (Math.tan(relativeAngle * DEG_TO_RAD) /
          Math.tan(halfHorizontal * DEG_TO_RAD)) *
          centre;

      const offset = Math.abs(screenX - centre);
      if (offset < nearestDistance) {
        nearestDistance = offset;
        nearestId = anchor.id;
      }
    }

    if (nearestId !== lastReported.value) {
      lastReported.value = nearestId;
      runOnJS(onFocusChange)(nearestId);
    }
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anchors.map((anchor) => (
        <Beam
          key={anchor.pin.id}
          anchor={anchor}
          headingDeg={headingDeg}
          pitchDeg={pitchDeg}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          horizontalFovDeg={horizontalFovDeg}
          verticalFovDeg={verticalFovDeg}
        />
      ))}
    </View>
  );
}
