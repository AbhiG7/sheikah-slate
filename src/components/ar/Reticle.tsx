import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";

const SIZE = 56;

interface ReticleProps {
  isFocused: boolean;
}

export function Reticle({ isFocused }: ReticleProps) {
  const focusAmount = useSharedValue(0);

  focusAmount.value = withTiming(isFocused ? 1 : 0, { duration: 150 });

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: isFocused ? Colors.gold : Colors.teal,
    transform: [{ scale: 1 - focusAmount.value * 0.12 }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.ring, ringStyle]} />
      <View style={[styles.dot, { backgroundColor: isFocused ? Colors.gold : Colors.teal }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -SIZE / 2,
    marginTop: -SIZE / 2,
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    opacity: 0.85,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
