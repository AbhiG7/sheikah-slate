import { router } from "expo-router";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function MapPickerScreen() {
  const { coords } = useUserLocation();
  const [picked, setPicked] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  const initialCamera = coords
    ? { coordinates: { latitude: coords.latitude, longitude: coords.longitude }, zoom: 12 }
    : undefined;

  const markers = picked
    ? [{ coordinates: picked, title: "New pin" }]
    : [];

  const handleMapClick = (event: { coordinates: { latitude?: number; longitude?: number } }) => {
    if (event.coordinates.latitude == null || event.coordinates.longitude == null) return;
    setPicked({
      latitude: event.coordinates.latitude,
      longitude: event.coordinates.longitude,
    });
  };

  const handleConfirm = () => {
    if (!picked) return;
    router.replace({
      pathname: "/(main)/pin-editor",
      params: {
        latitude: String(picked.latitude),
        longitude: String(picked.longitude),
        sourceMode: "map_pick",
      },
    });
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "ios" ? (
        <AppleMaps.View
          style={StyleSheet.absoluteFill}
          cameraPosition={initialCamera}
          markers={markers}
          onMapClick={handleMapClick}
        />
      ) : (
        <GoogleMaps.View
          style={StyleSheet.absoluteFill}
          cameraPosition={initialCamera}
          markers={markers}
          onMapClick={handleMapClick}
        />
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.hint} pointerEvents="none">
          <ThemedText type="small" color="text">
            Tap anywhere on the map to place a pin
          </ThemedText>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <ThemedText color="text" type="smallBold">
              Cancel
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.confirmButton, !picked && styles.confirmDisabled]}
            onPress={handleConfirm}
            disabled={!picked}
          >
            <ThemedText color="background" type="smallBold">
              Use This Spot
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: Spacing.three,
  },
  hint: {
    alignSelf: "center",
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.three,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.two,
  },
  confirmButton: {
    flex: 2,
    alignItems: "center",
    paddingVertical: Spacing.three,
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
});
