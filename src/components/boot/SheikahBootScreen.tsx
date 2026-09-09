import { useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import {
  APP_TAGLINE,
  ATTRIBUTIONS,
  DISCLAIMER,
} from "@/constants/attribution";
import { Colors, Spacing } from "@/constants/theme";

import { SheikahBar } from "./SheikahBar";
import { SheikahEmblem } from "./SheikahEmblem";

/** Minimum time the slate stays up, even if the app is ready sooner. */
const MINIMUM_VISIBLE_MS = 500;
const SEAM_FLASH_MS = 220;
const SPLIT_MS = 620;

const PANEL_BLUE = "#0B2A3A";
const PANEL_EDGE = "#061821";

interface SheikahBootScreenProps {
  /** Flips true once the app has finished its own start-up work. */
  isReady: boolean;
  onFinished: () => void;
}

export function SheikahBootScreen({ isReady, onFinished }: SheikahBootScreenProps) {
  const { width, height } = useWindowDimensions();
  const barWidth = Math.max(28, Math.min(56, width * 0.055));

  const split = useSharedValue(0);
  const seam = useSharedValue(0);
  const mountedAt = useRef(0);
  const [hasStartedExit, setHasStartedExit] = useState(false);

  // Declared first so it runs before the readiness effect on the initial
  // commit; reading the clock during render would be an impure call.
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isReady || hasStartedExit) return;

    // "Whichever comes last": wait out the remainder of the minimum hold if
    // the app happened to be ready before it elapsed.
    const elapsed = Date.now() - mountedAt.current;
    const remaining = Math.max(0, MINIMUM_VISIBLE_MS - elapsed);

    const timer = setTimeout(() => {
      setHasStartedExit(true);

      // The seam flares first, then the halves are driven apart by it.
      seam.value = withTiming(1, { duration: SEAM_FLASH_MS });
      split.value = withDelay(
        SEAM_FLASH_MS,
        withTiming(
          1,
          { duration: SPLIT_MS, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(onFinished)();
          }
        )
      );
    }, remaining);

    return () => clearTimeout(timer);
  }, [isReady, hasStartedExit, onFinished, seam, split]);

  const leftHalfStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -split.value * (width / 2) }],
    opacity: 1 - split.value * 0.35,
  }));

  const rightHalfStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: split.value * (width / 2) }],
    opacity: 1 - split.value * 0.35,
  }));

  const seamStyle = useAnimatedStyle(() => ({
    opacity: seam.value * (1 - split.value * 0.9),
    transform: [{ scaleX: 1 + seam.value * 14 + split.value * 30 }],
  }));

  // The full slate face, rendered into each half and offset so the two
  // clipped windows reassemble into one continuous image.
  const face = (
    <View style={{ width, height }}>
      <View style={[styles.panel, { backgroundColor: PANEL_BLUE }]}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="panel-glow" cx="50%" cy="50%" r="70%">
              <Stop offset="0" stopColor={Colors.teal} stopOpacity={0.22} />
              <Stop offset="0.6" stopColor={Colors.teal} stopOpacity={0.05} />
              <Stop offset="1" stopColor={PANEL_EDGE} stopOpacity={0.55} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#panel-glow)" />
        </Svg>

        {/* Faint scan lines for the ancient-display feel. */}
        {Array.from({ length: Math.floor(height / 6) }).map((_, i) => (
          <View key={i} style={[styles.scanLine, { top: i * 6 }]} />
        ))}

        <View style={[styles.content, { paddingHorizontal: barWidth + Spacing.four }]}>
          <SheikahEmblem size={Math.min(height * 0.42, 150)} />

          <View style={styles.divider} />

          <View style={styles.textBlock}>
            <ThemedText type="subtitle" color="teal" style={styles.title}>
              SHEIKAH SLATE
            </ThemedText>
            <ThemedText type="small" color="textSecondary">
              {APP_TAGLINE}
            </ThemedText>

            <View style={styles.credits}>
              {ATTRIBUTIONS.map((entry) => (
                <View key={entry.role} style={styles.creditRow}>
                  <ThemedText type="code" color="teal" style={styles.creditRole}>
                    {entry.role}
                  </ThemedText>
                  <ThemedText type="code" color="textSecondary" style={styles.creditValue}>
                    {entry.credit}
                  </ThemedText>
                </View>
              ))}
            </View>

            <ThemedText type="code" color="textSecondary" style={styles.disclaimer}>
              {DISCLAIMER}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.bar, { left: 0 }]}>
          <SheikahBar width={barWidth} height={height} side="left" />
        </View>
        <View style={[styles.bar, { right: 0 }]}>
          <SheikahBar width={barWidth} height={height} side="right" />
        </View>
      </View>
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <Animated.View
        style={[styles.half, { width: width / 2, left: 0 }, leftHalfStyle]}
      >
        <View style={{ position: "absolute", left: 0 }}>{face}</View>
      </Animated.View>

      <Animated.View
        style={[styles.half, { width: width / 2, left: width / 2 }, rightHalfStyle]}
      >
        <View style={{ position: "absolute", left: -width / 2 }}>{face}</View>
      </Animated.View>

      <Animated.View
        style={[
          styles.seam,
          { left: width / 2 - 1.5, height },
          seamStyle,
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  half: {
    position: "absolute",
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  panel: {
    flex: 1,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#7FE8DC",
    opacity: 0.028,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
  },
  divider: {
    width: 1,
    height: "55%",
    backgroundColor: Colors.teal,
    opacity: 0.3,
  },
  textBlock: {
    flexShrink: 1,
    gap: Spacing.one,
    maxWidth: 420,
  },
  title: {
    letterSpacing: 4,
  },
  credits: {
    marginTop: Spacing.two,
    gap: 2,
  },
  creditRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  creditRole: {
    width: 74,
    opacity: 0.9,
  },
  creditValue: {
    flexShrink: 1,
  },
  disclaimer: {
    marginTop: Spacing.two,
    opacity: 0.55,
    lineHeight: 13,
  },
  bar: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  seam: {
    position: "absolute",
    top: 0,
    width: 3,
    backgroundColor: "#DFFFFA",
    shadowColor: Colors.teal,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
});
