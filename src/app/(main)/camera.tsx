import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BeamOverlay } from "@/components/ar/BeamOverlay";
import { CameraPassthrough } from "@/components/ar/CameraPassthrough";
import { Reticle } from "@/components/ar/Reticle";
import { SidePanel } from "@/components/panel/SidePanel";
import { DistancePicker } from "@/components/pin-creation/DistancePicker";
import { PinModeSelector } from "@/components/pin-creation/PinModeSelector";
import type { PinMode } from "@/components/pin-creation/PinModeSelector";
import { PlacePinButton } from "@/components/pin-creation/PlacePinButton";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { ARStateProvider, useARState } from "@/context/ARStateContext";
import { usePins } from "@/context/PinsContext";
import { useBeamProjections } from "@/hooks/useBeamProjections";
import { useFocusedBeam } from "@/hooks/useFocusedBeam";
import { destinationPoint } from "@/lib/geo/haversine";

function CameraScreenContent() {
  const { pins } = usePins();
  const { location, headingDeg, pitchDeg } = useARState();
  const projections = useBeamProjections(pins, location, headingDeg, pitchDeg);
  const focusedPinId = useFocusedBeam(projections);
  const focused = projections.find((p) => p.pin.id === focusedPinId) ?? null;

  const [modeSelectorVisible, setModeSelectorVisible] = useState(false);
  const [distancePickerVisible, setDistancePickerVisible] = useState(false);

  const handleSelectMode = (mode: PinMode) => {
    setModeSelectorVisible(false);

    if (mode === "current_location") {
      if (!location.coords) return;
      router.push({
        pathname: "/(main)/pin-editor",
        params: {
          latitude: String(location.coords.latitude),
          longitude: String(location.coords.longitude),
          altitude: location.coords.altitude != null ? String(location.coords.altitude) : undefined,
          sourceMode: "current_location",
        },
      });
      return;
    }

    if (mode === "map_pick") {
      router.push("/(main)/map-picker");
      return;
    }

    if (mode === "aim_distance") {
      setDistancePickerVisible(true);
    }
  };

  const handleConfirmDistance = (distanceMeters: number) => {
    setDistancePickerVisible(false);
    if (!location.coords || !Number.isFinite(distanceMeters) || distanceMeters <= 0) return;

    const destination = destinationPoint(location.coords, headingDeg, distanceMeters);
    router.push({
      pathname: "/(main)/pin-editor",
      params: {
        latitude: String(destination.latitude),
        longitude: String(destination.longitude),
        sourceMode: "aim_distance",
      },
    });
  };

  return (
    <View style={styles.container}>
      <CameraPassthrough />
      <BeamOverlay projections={projections} focusedPinId={focusedPinId} />
      <Reticle isFocused={focusedPinId !== null} />
      <SidePanel
        focusedPin={focused?.pin ?? null}
        distanceMeters={focused?.distanceMeters ?? 0}
        bearingDeg={focused?.bearingDeg ?? 0}
      />

      <SafeAreaView style={styles.topBar} pointerEvents="box-none">
        <Pressable style={styles.iconButton} onPress={() => router.push("/(main)/pins-list")}>
          <ThemedText color="text" type="smallBold">
            Pins
          </ThemedText>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => router.push("/(main)/settings")}>
          <ThemedText color="text" type="smallBold">
            ⚙
          </ThemedText>
        </Pressable>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar} pointerEvents="box-none">
        <PlacePinButton onPress={() => setModeSelectorVisible(true)} />
      </SafeAreaView>

      <PinModeSelector
        visible={modeSelectorVisible}
        onSelect={handleSelectMode}
        onClose={() => setModeSelectorVisible(false)}
      />
      <DistancePicker
        visible={distancePickerVisible}
        onConfirm={handleConfirmDistance}
        onClose={() => setDistancePickerVisible(false)}
      />
    </View>
  );
}

export default function CameraScreen() {
  return (
    <ARStateProvider>
      <CameraScreenContent />
    </ARStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.three,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Spacing.four,
  },
  iconButton: {
    backgroundColor: "#00000088",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
