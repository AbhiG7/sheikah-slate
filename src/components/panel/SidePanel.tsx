import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import type { Pin } from "@/types/pin";

import { MapPreview } from "./MapPreview";
import { OpenInMapsButton } from "./OpenInMapsButton";
import { PinDetailCard } from "./PinDetailCard";

const PANEL_WIDTH = 280;

interface SidePanelProps {
  focusedPin: Pin | null;
  distanceMeters: number;
  bearingDeg: number;
}

export function SidePanel({ focusedPin, distanceMeters, bearingDeg }: SidePanelProps) {
  const translateX = useSharedValue(PANEL_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(focusedPin ? 0 : PANEL_WIDTH, { duration: 250 });
  }, [focusedPin, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      <SafeAreaView style={styles.safeArea}>
        {focusedPin ? (
          <>
            <PinDetailCard
              pin={focusedPin}
              distanceMeters={distanceMeters}
              bearingDeg={bearingDeg}
            />
            <MapPreview
              latitude={focusedPin.latitude}
              longitude={focusedPin.longitude}
              label={focusedPin.label}
            />
            <OpenInMapsButton
              latitude={focusedPin.latitude}
              longitude={focusedPin.longitude}
              label={focusedPin.label}
            />
          </>
        ) : null}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: Colors.backgroundElevated,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
