import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";
import {
  BEAM_WORLD_HEIGHT_M,
  MAX_RENDER_DISTANCE_M,
  MIN_BEAM_SCREEN_PX,
} from "@/lib/geo/constants";
import type { PinAnchor } from "@/hooks/usePinAnchors";

const GLOW_WIDTH = 40;
const CORE_WIDTH = 5;
const DEG_TO_RAD = Math.PI / 180;

interface BeamProps {
  anchor: PinAnchor;
  headingDeg: SharedValue<number>;
  pitchDeg: SharedValue<number>;
  screenWidth: number;
  screenHeight: number;
  horizontalFovDeg: number;
  verticalFovDeg: number;
}

/**
 * A pin rendered as a pillar of light rising from the spot it marks.
 *
 * The whole projection runs inside the animated style, driven directly by
 * the orientation shared values. Nothing here re-renders while you pan: the
 * position is recomputed per frame by the animation runtime, which is the
 * difference between tracking the camera and lagging seconds behind it.
 *
 * The maths is inlined rather than calling the helpers in lib/geo because a
 * worklet cannot reach ordinary imported functions.
 */
export function Beam({
  anchor,
  headingDeg,
  pitchDeg,
  screenWidth,
  screenHeight,
  horizontalFovDeg,
  verticalFovDeg,
}: BeamProps) {
  const { bearingDeg, distanceMeters, altitudeDeltaM } = anchor;

  const baseOpacity = Math.min(
    1,
    Math.max(0.35, 1 - distanceMeters / MAX_RENDER_DISTANCE_M)
  );

  const animatedStyle = useAnimatedStyle(() => {
    const halfHorizontal = horizontalFovDeg / 2;
    const relativeAngle =
      (((bearingDeg - headingDeg.value + 540) % 360) - 180);

    // Off-frame beams cost nothing beyond this early exit.
    if (Math.abs(relativeAngle) > halfHorizontal) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }], height: 0 };
    }

    const screenX =
      screenWidth / 2 +
      (Math.tan(relativeAngle * DEG_TO_RAD) /
        Math.tan(halfHorizontal * DEG_TO_RAD)) *
        (screenWidth / 2);

    const halfVertical = verticalFovDeg / 2;
    const horizonY =
      screenHeight / 2 + (pitchDeg.value / halfVertical) * (screenHeight / 2);

    const baseElevation =
      distanceMeters > 0
        ? Math.atan2(altitudeDeltaM, distanceMeters) / DEG_TO_RAD
        : 0;
    const topElevation =
      distanceMeters > 0
        ? Math.atan2(altitudeDeltaM + BEAM_WORLD_HEIGHT_M, distanceMeters) /
          DEG_TO_RAD
        : 0;

    const baseY = horizonY - (baseElevation / halfVertical) * (screenHeight / 2);
    const topY = horizonY - (topElevation / halfVertical) * (screenHeight / 2);
    const height = Math.min(
      screenHeight,
      Math.max(MIN_BEAM_SCREEN_PX, baseY - topY)
    );

    return {
      opacity: 1,
      height,
      transform: [
        { translateX: screenX - GLOW_WIDTH / 2 },
        { translateY: baseY - height },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: 0, width: GLOW_WIDTH }, animatedStyle]} pointerEvents="none">
      <Svg width={GLOW_WIDTH} height="100%" preserveAspectRatio="none">
        <Defs>
          {/* y1 is the bottom: solid at the base, gone at the top. */}
          <LinearGradient id="beam-glow" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={Colors.teal} stopOpacity={baseOpacity * 0.4} />
            <Stop offset="0.45" stopColor={Colors.teal} stopOpacity={baseOpacity * 0.14} />
            <Stop offset="1" stopColor={Colors.teal} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="beam-core" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={baseOpacity} />
            <Stop offset="0.12" stopColor={Colors.teal} stopOpacity={baseOpacity} />
            <Stop offset="0.65" stopColor={Colors.teal} stopOpacity={baseOpacity * 0.45} />
            <Stop offset="1" stopColor={Colors.teal} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={GLOW_WIDTH} height="100%" fill="url(#beam-glow)" />
        <Rect
          x={GLOW_WIDTH / 2 - CORE_WIDTH}
          y={0}
          width={CORE_WIDTH * 2}
          height="100%"
          fill="url(#beam-glow)"
        />
        <Rect
          x={GLOW_WIDTH / 2 - CORE_WIDTH / 2}
          y={0}
          width={CORE_WIDTH}
          height="100%"
          fill="url(#beam-core)"
        />
      </Svg>
    </Animated.View>
  );
}
