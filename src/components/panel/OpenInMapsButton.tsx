import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { openInMaps } from "@/lib/maps/openInMaps";

interface OpenInMapsButtonProps {
  latitude: number;
  longitude: number;
  label: string;
}

export function OpenInMapsButton({ latitude, longitude, label }: OpenInMapsButtonProps) {
  return (
    <Pressable
      style={styles.button}
      onPress={() => openInMaps({ latitude, longitude, label })}
    >
      <ThemedText color="background" type="smallBold">
        Open in Maps
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: "center",
  },
});
