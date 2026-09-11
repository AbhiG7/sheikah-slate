import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import type { Pin } from "@/types/pin";

import { OpenInMapsButton } from "./OpenInMapsButton";

const CARD_WIDTH = 236;
const GAP = 18;

/** The boot slate's panel blue, carried through so the card reads as the
 *  same projected surface. Alpha kept low enough to see the world behind. */
const HUD_BLUE = "#0B2A3ACC";
const HUD_EDGE = "#3FE0D055";

interface BeamCardProps {
  pin: Pin;
  /** Horizontal screen position of the beam it belongs to. */
  beamX: number;
  /** Screen Y of the beam's base. */
  beamY: number;
  screenWidth: number;
  screenHeight: number;
  /** Width of the bronze bars, so the card never slides underneath them. */
  insetX: number;
  distanceMeters: number;
  bearingDeg: number;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  if (miles >= 0.2) return `${miles.toFixed(miles < 10 ? 2 : 1)} mi`;
  return `${Math.round(meters)} m`;
}

function compass(deg: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(deg / 45) % 8];
}

/**
 * Detail card tethered to a beam. It sits to the right of the beam by
 * default and flips to the left when there is not enough room, so it never
 * runs off the edge or hides under a bronze bar.
 */
export function BeamCard({
  pin,
  beamX,
  beamY,
  screenWidth,
  screenHeight,
  insetX,
  distanceMeters,
  bearingDeg,
}: BeamCardProps) {
  const rightEdge = screenWidth - insetX;
  const fitsOnRight = beamX + GAP + CARD_WIDTH <= rightEdge;

  const left = fitsOnRight
    ? beamX + GAP
    : Math.max(insetX + Spacing.two, beamX - GAP - CARD_WIDTH);

  // Hang the card just above the beam base, kept fully on screen.
  const top = Math.min(
    Math.max(Spacing.three, beamY - 150),
    screenHeight - 190
  );

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      style={[styles.card, { left, top, width: CARD_WIDTH }]}
    >
      <View
        style={[
          styles.tether,
          fitsOnRight ? { left: -GAP } : { right: -GAP },
        ]}
      />
      <View style={styles.cornerTopLeft} pointerEvents="none" />
      <View style={styles.cornerBottomRight} pointerEvents="none" />

      <ThemedText type="smallBold" color="teal" numberOfLines={2}>
        {pin.label}
      </ThemedText>

      <View style={styles.stats}>
        <ThemedText type="code" color="gold">
          {formatDistance(distanceMeters)}
        </ThemedText>
        <ThemedText type="code" color="textSecondary">
          {Math.round(bearingDeg)}&deg; {compass(bearingDeg)}
        </ThemedText>
        {pin.altitude != null ? (
          <ThemedText type="code" color="textSecondary">
            {Math.round(pin.altitude)} m
          </ThemedText>
        ) : null}
      </View>

      {pin.notes ? (
        <ThemedText type="code" color="textSecondary" numberOfLines={2}>
          {pin.notes}
        </ThemedText>
      ) : null}

      <OpenInMapsButton
        latitude={pin.latitude}
        longitude={pin.longitude}
        label={pin.label}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    backgroundColor: HUD_BLUE,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: HUD_EDGE,
    padding: Spacing.three,
    gap: Spacing.two,
    // Outer bloom so it floats off the camera feed rather than sitting on it.
    shadowColor: Colors.teal,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  // Sheikah-style corner brackets, drawn as two overlapping borders.
  cornerTopLeft: {
    position: "absolute",
    top: -1,
    left: -1,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.teal,
    borderTopLeftRadius: Spacing.two,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.teal,
    borderBottomRightRadius: Spacing.two,
  },
  tether: {
    position: "absolute",
    top: "50%",
    width: GAP,
    height: 1,
    backgroundColor: Colors.teal,
    opacity: 0.7,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});
