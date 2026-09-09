import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";

const MENU_WIDTH = 240;
const EDGE_STRIP = 28;
const OPEN_THRESHOLD = 40;

const DESTINATIONS = [
  { label: "Pins", detail: "Everything you have marked", path: "/(main)/pins-list" },
  { label: "Settings", detail: "Field of view calibration", path: "/(main)/settings" },
  {
    label: "Diagnostics",
    detail: "Live gravity, compass, GPS",
    path: "/(main)/diagnostics",
  },
] as const;

interface EdgeMenuProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Slide-out navigation, opened by dragging in from the left edge.
 *
 * The viewfinder carries no buttons, so this is the only route to the pins
 * list, calibration, and sensor diagnostics. The grab strip is deliberately
 * narrow so it does not swallow taps meant for the identify gesture.
 */
export function EdgeMenu({ isOpen, onOpen, onClose }: EdgeMenuProps) {
  const offset = useSharedValue(-MENU_WIDTH);

  useEffect(() => {
    offset.value = withTiming(isOpen ? 0 : -MENU_WIDTH, { duration: 220 });
  }, [isOpen, offset]);

  // The gestures only decide open or closed; the effect above owns the
  // animation. Tracking the finger would mean mutating a shared value
  // inside the callback, which the React Compiler rightly objects to, and
  // buys little for a menu that just slides in and out.
  const edgeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onEnd((event) => {
      if (event.translationX > OPEN_THRESHOLD) runOnJS(onOpen)();
    });

  const closeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onEnd((event) => {
      if (event.translationX < -OPEN_THRESHOLD) runOnJS(onClose)();
    });

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: (1 + offset.value / MENU_WIDTH) * 0.6,
  }));

  return (
    <>
      {!isOpen ? (
        <GestureDetector gesture={edgeGesture}>
          <View style={styles.grabStrip} />
        </GestureDetector>
      ) : null}

      {isOpen ? (
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
      ) : null}

      <GestureDetector gesture={closeGesture}>
        <Animated.View style={[styles.menu, menuStyle]} pointerEvents={isOpen ? "auto" : "none"}>
          <SafeAreaView style={styles.menuInner}>
            <ThemedText type="code" color="textSecondary" style={styles.heading}>
              SLATE
            </ThemedText>

            {DESTINATIONS.map((destination) => (
              <Pressable
                key={destination.label}
                style={styles.item}
                onPress={() => {
                  onClose();
                  router.push(destination.path);
                }}
              >
                <ThemedText type="smallBold" color="teal">
                  {destination.label}
                </ThemedText>
                <ThemedText type="code" color="textSecondary">
                  {destination.detail}
                </ThemedText>
              </Pressable>
            ))}

            <ThemedText type="code" color="textSecondary" style={styles.hint}>
              Tap anywhere on the viewfinder to identify what you are looking at.
            </ThemedText>
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  grabStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_STRIP,
  },
  scrim: {
    backgroundColor: "#000",
  },
  menu: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: "#08222FF2",
    borderRightWidth: 1,
    borderRightColor: Colors.teal,
  },
  menuInner: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  heading: {
    letterSpacing: 3,
    opacity: 0.7,
    marginBottom: Spacing.two,
  },
  item: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: 2,
  },
  hint: {
    marginTop: "auto",
    opacity: 0.6,
    lineHeight: 14,
  },
});
