import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { Pin } from "@/types/pin";

interface PinDetailCardProps {
  pin: Pin;
  distanceMeters: number;
  bearingDeg: number;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 2 : 1)} km`;
}

function formatBearing(deg: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return `${Math.round(deg)}° ${directions[index]}`;
}

export function PinDetailCard({ pin, distanceMeters, bearingDeg }: PinDetailCardProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" color="teal" numberOfLines={1}>
        {pin.label}
      </ThemedText>
      <View style={styles.metaRow}>
        <ThemedText type="smallBold" color="gold">
          {formatDistance(distanceMeters)}
        </ThemedText>
        <ThemedText type="small" color="textSecondary">
          {formatBearing(bearingDeg)}
        </ThemedText>
      </View>
      {pin.notes ? (
        <ThemedText type="small" color="textSecondary" numberOfLines={3}>
          {pin.notes}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.three,
    alignItems: "center",
  },
});
