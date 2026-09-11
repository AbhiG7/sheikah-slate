import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useCompassHeading } from "@/hooks/useCompassHeading";
import { useGravityVector } from "@/hooks/useGravityVector";
import { useTerrainPreload } from "@/hooks/useTerrainPreload";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  describeWebSensorSupport,
  requestWebSensorPermission,
  type WebSensorPermissionResult,
} from "@/lib/sensors/webSensorPermission";
import { GRAVITY_Z_SIGN, pitchFromGravity } from "@/lib/terrain/attitude";

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
 * Live sensor readout, whose main job is settling the gravity Z sign that
 * decides whether pitch comes out inverted.
 *
 * Everything here goes through the same platform-split hooks the app uses.
 * Reaching for expo-sensors or expo-location directly breaks on web, where
 * DeviceMotion exposes no addListener and heading is a no-op stub.
 */
export default function DiagnosticsScreen() {
  const { coords, accuracy, error } = useUserLocation();
  const gravity = useGravityVector();
  // Its own instance: diagnostics can be opened outside the AR subtree, and
  // the underlying tile cache is shared anyway.
  const preload = useTerrainPreload({ coords, accuracy, error });
  const headingDeg = useCompassHeading();

  const [permissionResult, setPermissionResult] =
    useState<WebSensorPermissionResult | null>(null);
  const support = describeWebSensorSupport();

  const magnitude = gravity
    ? Math.sqrt(gravity.x ** 2 + gravity.y ** 2 + gravity.z ** 2)
    : null;

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
          {Platform.OS === "web" ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" color="gold">
                Sensor access
              </ThemedText>
              <Row
                label="secure context (HTTPS)"
                value={globalThis.isSecureContext ? "yes" : "NO - blocks all sensors"}
              />
              <Row
                label="origin"
                value={
                  typeof location !== "undefined" ? location.origin : "unknown"
                }
              />
              <Row
                label="devicemotion supported"
                value={support.hasMotionEvent ? "yes" : "NO"}
              />
              <Row
                label="deviceorientation supported"
                value={support.hasOrientationEvent ? "yes" : "NO"}
              />
              <Row
                label="needs permission"
                value={support.needsPermission ? "yes (iOS)" : "no"}
              />
              <Row
                label="last request"
                value={permissionResult ?? "not requested"}
              />
              <Row
                label="receiving motion"
                value={gravity ? "yes" : "no"}
              />

              <Pressable
                style={styles.grantButton}
                onPress={async () => {
                  setPermissionResult(await requestWebSensorPermission());
                }}
              >
                <ThemedText color="background" type="smallBold">
                  Enable Motion Access
                </ThemedText>
              </Pressable>

              <ThemedText type="small" color="textSecondary" style={styles.help}>
                If this reports denied, iOS blocks re-prompting for the page.
                Check Settings, Apps, Safari, Motion &amp; Orientation Access is
                on, then fully close the tab and reopen it.
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText type="smallBold" color="gold">
              Pitch calibration
            </ThemedText>

            {gravity ? (
              <>
                <ThemedText type="small" color="textSecondary" style={styles.help}>
                  Hold each pose and read the two columns. Whichever matches
                  the expected value is the correct sign.
                </ThemedText>

                <View style={styles.poseList}>
                  <ThemedText type="small" color="text">
                    1. Upright, camera at the horizon &rarr; 0&deg;
                  </ThemedText>
                  <ThemedText type="small" color="text">
                    2. Flat on a table, screen up &rarr; -90&deg;
                  </ThemedText>
                  <ThemedText type="small" color="text">
                    3. Tilted up about 45&deg; &rarr; +45&deg;
                  </ThemedText>
                </View>

                <View style={styles.pitchRow}>
                  <View
                    style={[
                      styles.pitchCell,
                      GRAVITY_Z_SIGN === 1 && styles.pitchCellActive,
                    ]}
                  >
                    <ThemedText type="small" color="textSecondary">
                      sign +1
                    </ThemedText>
                    <ThemedText type="subtitle" color="teal">
                      {pitchFromGravity(gravity, 1).toFixed(1)}&deg;
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.pitchCell,
                      GRAVITY_Z_SIGN === -1 && styles.pitchCellActive,
                    ]}
                  >
                    <ThemedText type="small" color="textSecondary">
                      sign -1
                    </ThemedText>
                    <ThemedText type="subtitle" color="teal">
                      {pitchFromGravity(gravity, -1).toFixed(1)}&deg;
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="code" color="textSecondary">
                  currently using sign {GRAVITY_Z_SIGN} (outlined)
                </ThemedText>
              </>
            ) : (
              <ThemedText type="small" color="textSecondary" style={styles.help}>
                No accelerometer readings. On a desktop browser this is
                expected. On a phone, tap the screen once to grant motion
                access, then come back.
              </ThemedText>
            )}
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
              value={magnitude !== null ? magnitude.toFixed(3) : "--"}
            />
            <ThemedText type="small" color="textSecondary">
              Magnitude should sit near 1.0 or 9.81 depending on units.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" color="gold">
              Compass
            </ThemedText>
            <Row label="heading" value={`${headingDeg.toFixed(1)} deg`} />
            <Row
              label="screen rotation"
              value={
                Platform.OS === "web"
                  ? `${
                      (window as unknown as { orientation?: number }).orientation ??
                      window.screen?.orientation?.angle ??
                      0
                    } deg`
                  : "n/a"
              }
            />
            <ThemedText type="small" color="textSecondary">
              Should track as you turn. If it sits at 0 on a phone, motion
              access was not granted. On a desktop, use the left and right
              arrow keys.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" color="gold">
              Terrain cache
            </ThemedText>
            <Row
              label="tiles loaded"
              value={
                preload.total > 0
                  ? `${preload.loaded} / ${preload.total}`
                  : "waiting for GPS"
              }
            />
            <Row label="state" value={preload.isLoading ? "loading" : "ready"} />
            <ThemedText type="small" color="textSecondary">
              Warmed at startup so tapping to identify reads memory rather
              than waiting on the network.
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
              value={
                coords?.altitude != null ? `${coords.altitude.toFixed(1)} m` : "--"
              }
            />
            <Row
              label="accuracy"
              value={accuracy != null ? `${accuracy.toFixed(1)} m` : "--"}
            />
            {error ? (
              <ThemedText type="small" color="danger">
                {error}
              </ThemedText>
            ) : null}
          </View>

          <ThemedText type="code" color="textSecondary">
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  pitchCellActive: {
    borderColor: Colors.teal,
  },
  grantButton: {
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: "center",
    marginTop: Spacing.two,
  },
});
