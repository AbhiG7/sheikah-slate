import * as Location from "expo-location";
import { router } from "expo-router";
import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useUserLocation } from "@/hooks/useUserLocation";
import { GravityFilter, pitchFromGravity } from "@/lib/terrain/attitude";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" color="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="code" color="text">
        {value}
      </ThemedText>
    </View>
  );
}

/**
 * Live sensor readout. Its main job is settling the gravity Z sign, which
 * decides whether pitch comes out inverted. The sign is a platform
 * convention rather than a per-device quirk, so this only needs doing once
 * per platform, after which it is a constant in useDeviceAttitude.
 */
export default function DiagnosticsScreen() {
  const { coords, accuracy } = useUserLocation();
  const [gravity, setGravity] = useState<Vec3 | null>(null);
  const [heading, setHeading] = useState<Location.LocationHeadingObject | null>(
    null
  );
  const filterRef = useRef(new GravityFilter());

  useEffect(() => {
    DeviceMotion.setUpdateInterval(100);
    const sub = DeviceMotion.addListener((m) => {
      const g = m.accelerationIncludingGravity;
      if (!g) return;
      setGravity(
        filterRef.current.next({ x: g.x ?? 0, y: g.y ?? 0, z: g.z ?? 0 })
      );
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    Location.watchHeadingAsync(setHeading).then((s) => {
      sub = s;
    });
    return () => sub?.remove();
  }, []);

  const pitchPositive = gravity ? pitchFromGravity(gravity, 1) : 0;
  const pitchNegative = gravity ? pitchFromGravity(gravity, -1) : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle" color="teal">
            Sensor Diagnostics
          </ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText color="textSecondary" type="smallBold">
              Close
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.section}>
            <ThemedText type="smallBold" color="gold">
              Pitch calibration
            </ThemedText>
            <ThemedText type="small" color="textSecondary" style={styles.help}>
              Hold each pose, then read the two pitch columns. The correct
              column is the one matching the expected value. Report which
              one wins and it becomes a constant.
            </ThemedText>

            <View style={styles.poseList}>
              <ThemedText type="small" color="text">
                1. Upright, camera at the horizon &rarr; expect 0&deg;
              </ThemedText>
              <ThemedText type="small" color="text">
                2. Flat on a table, screen up &rarr; expect -90&deg;
              </ThemedText>
              <ThemedText type="small" color="text">
                3. Tilted up ~45&deg; &rarr; expect +45&deg;
              </ThemedText>
            </View>

            <View style={styles.pitchRow}>
              <View style={styles.pitchCell}>
                <ThemedText type="small" color="textSecondary">
                  sign +1
                </ThemedText>
                <ThemedText type="subtitle" color="teal">
                  {pitchPositive.toFixed(1)}&deg;
                </ThemedText>
              </View>
              <View style={styles.pitchCell}>
                <ThemedText type="small" color="textSecondary">
                  sign -1
                </ThemedText>
                <ThemedText type="subtitle" color="teal">
                  {pitchNegative.toFixed(1)}&deg;
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" color="gold">
              Gravity (smoothed)
            </ThemedText>
            <Row label="x" value={gravity ? gravity.x.toFixed(3) : "--"} />
            <Row label="y" value={gravity ? gravity.y.toFixed(3) : "--"} />
            <Row label="z" value={gravity ? gravity.z.toFixed(3) : "--"} />
            <Row
              label="magnitude"
              value={
                gravity
                  ? Math.sqrt(
                      gravity.x ** 2 + gravity.y ** 2 + gravity.z ** 2
                    ).toFixed(3)
                  : "--"
              }
            />
            <ThemedText type="small" color="textSecondary">
              Magnitude should sit near 1.0 or 9.81 depending on units.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" color="gold">
              Compass
            </ThemedText>
            <Row
              label="true heading"
              value={heading ? `${heading.trueHeading.toFixed(1)}deg` : "--"}
            />
            <Row
              label="magnetic heading"
              value={heading ? `${heading.magHeading.toFixed(1)}deg` : "--"}
            />
            <Row
              label="accuracy"
              value={heading ? String(heading.accuracy) : "--"}
            />
            <ThemedText type="small" color="textSecondary">
              On iOS accuracy is in degrees. Anything above about 15 means
              the compass wants a figure-eight recalibration.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" color="gold">
              Location
            </ThemedText>
            <Row
              label="latitude"
              value={coords ? coords.latitude.toFixed(6) : "--"}
            />
            <Row
              label="longitude"
              value={coords ? coords.longitude.toFixed(6) : "--"}
            />
            <Row
              label="GPS altitude"
              value={coords?.altitude != null ? `${coords.altitude.toFixed(1)} m` : "--"}
            />
            <Row
              label="accuracy"
              value={accuracy != null ? `${accuracy.toFixed(1)} m` : "--"}
            />
          </View>

          <ThemedText type="small" color="textSecondary">
            Platform: {Platform.OS}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.three },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  section: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  help: { lineHeight: 18 },
  poseList: { gap: Spacing.half, marginVertical: Spacing.two },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pitchRow: { flexDirection: "row", gap: Spacing.three },
  pitchCell: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.backgroundElement,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
