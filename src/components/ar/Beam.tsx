import { useEffect } from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";

const REF_DISTANCE_M = 100;
const MIN_HEIGHT = 50;
const MAX_HEIGHT = 240;
const MAX_RENDER_DISTANCE_M = 50_000;
const GLOW_WIDTH = 36;
const CORE_WIDTH = 6;

interface BeamProps {
  screenX: number;
  baseY: number;
  distanceMeters: number;
  focused: boolean;
}

function heightForDistance(distanceMeters: number): number {
  const scaled = 140 * Math.sqrt(REF_DISTANCE_M / Math.max(distanceMeters, 1));
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, scaled));
}

function opacityForDistance(distanceMeters: number): number {
  const ratio = 1 - distanceMeters / MAX_RENDER_DISTANCE_M;
  return Math.min(1, Math.max(0.15, ratio));
}

export function Beam({ screenX, baseY, distanceMeters, focused }: BeamProps) {
  const height = heightForDistance(distanceMeters);
  const baseOpacity = opacityForDistance(distanceMeters);
  const strokeWidth = distanceMeters < 500 ? CORE_WIDTH : CORE_WIDTH * 0.6;

  const animX = useSharedValue(screenX);
  const animY = useSharedValue(baseY);
  const animFocus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    animX.value = withTiming(screenX, { duration: 100 });
    animY.value = withTiming(baseY, { duration: 100 });
  }, [screenX, baseY, animX, animY]);

  useEffect(() => {
    animFocus.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused, animFocus]);

  const containerStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: animX.value - GLOW_WIDTH / 2,
    top: animY.value - height,
    width: GLOW_WIDTH,
    height,
    transform: [{ scale: 1 + animFocus.value * 0.15 }],
  }));

  const color = focused ? Colors.gold : Colors.teal;
  const glowColor = focused ? Colors.gold : Colors.tealDim;

  return (
    <Animated.View style={containerStyle} pointerEvents="none">
      <Svg width={GLOW_WIDTH} height={height}>
        <Defs>
          <LinearGradient id="glow" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={glowColor} stopOpacity={baseOpacity * 0.5} />
            <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="core" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={baseOpacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={GLOW_WIDTH} height={height} fill="url(#glow)" />
        <Rect
          x={GLOW_WIDTH / 2 - strokeWidth / 2}
          y={0}
          width={strokeWidth}
          height={height}
          fill="url(#core)"
        />
      </Svg>
    </Animated.View>
  );
}
