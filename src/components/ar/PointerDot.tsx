import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";

const RING = 44;

interface PointerDotProps {
  /** A beam is under the pointer. */
  isFocused: boolean;
  /** A ray cast is in flight. */
  isScanning: boolean;
}

/**
 * The only permanent element on the viewfinder: a small aiming dot at dead
 * centre. It grows a ring when a beam falls under it, and pulses while a
 * scan is running, which is the sole feedback channel now that the screen
 * carries no buttons.
 */
export function PointerDot({ isFocused, isScanning }: PointerDotProps) {
  const pulse = useSharedValue(0);
  const focus = useSharedValue(0);

  useEffect(() => {
    pulse.value = isScanning
      ? withRepeat(
          withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
          -1,
          false
        )
      : withTiming(0, { duration: 200 });
  }, [isScanning, pulse]);

  useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, { duration: 180 });
  }, [isFocused, focus]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value === 0 ? 0 : (1 - pulse.value) * 0.7,
    transform: [{ scale: 0.4 + pulse.value * 1.3 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + focus.value * 0.75,
    transform: [{ scale: 0.55 + focus.value * 0.45 }],
    borderColor: isFocused ? Colors.gold : Colors.teal,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * 0.5 }],
    backgroundColor: isFocused ? Colors.gold : Colors.teal,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.ring, pulseStyle]} />
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.dot, dotStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -RING / 2,
    marginTop: -RING / 2,
    width: RING,
    height: RING,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1.5,
    borderColor: Colors.teal,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.teal,
  },
});
