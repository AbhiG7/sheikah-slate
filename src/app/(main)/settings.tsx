import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useFovMultiplier } from "@/hooks/useFovMultiplier";
import {
  MAX_FOV_MULTIPLIER,
  MIN_FOV_MULTIPLIER,
} from "@/lib/geo/fovCalibration";

const STEP = 0.05;

export default function SettingsScreen() {
  const [fovMultiplier, setFovMultiplier] = useFovMultiplier();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle" color="teal">
            Settings
          </ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText color="textSecondary" type="smallBold">
              Close
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <ThemedText type="smallBold" color="text">
            Camera FOV Calibration
          </ThemedText>
          <ThemedText type="small" color="textSecondary" style={styles.description}>
            If beams consistently land to one side of where they should be,
            adjust this until a beam for a pin you&apos;re looking straight
            at lines up with the reticle.
          </ThemedText>

          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperButton}
              onPress={() =>
                setFovMultiplier(Math.max(MIN_FOV_MULTIPLIER, fovMultiplier - STEP))
              }
            >
              <ThemedText color="text" type="subtitle">
                −
              </ThemedText>
            </Pressable>
            <ThemedText type="smallBold" color="gold">
              {(fovMultiplier * 100).toFixed(0)}%
            </ThemedText>
            <Pressable
              style={styles.stepperButton}
              onPress={() =>
                setFovMultiplier(Math.min(MAX_FOV_MULTIPLIER, fovMultiplier + STEP))
              }
            >
              <ThemedText color="text" type="subtitle">
                +
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.linkRow}
          onPress={() => router.push("/(main)/diagnostics")}
        >
          <ThemedText type="smallBold" color="teal">
            Sensor Diagnostics
          </ThemedText>
          <ThemedText type="small" color="textSecondary">
            Live gravity, compass, and GPS readout
          </ThemedText>
        </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  scroll: { gap: Spacing.four, paddingBottom: Spacing.four },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  description: {
    lineHeight: 20,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  linkRow: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundElement,
    alignItems: "center",
    justifyContent: "center",
  },
});
