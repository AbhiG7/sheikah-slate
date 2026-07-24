import { AppleMaps, GoogleMaps } from "expo-maps";
import { Platform, StyleSheet, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  label: string;
}

export function MapPreview({ latitude, longitude, label }: MapPreviewProps) {
  const cameraPosition = { coordinates: { latitude, longitude }, zoom: 14 };
  const markers = [{ coordinates: { latitude, longitude }, title: label }];

  return (
    <View style={styles.container}>
      {Platform.OS === "ios" ? (
        <AppleMaps.View
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          markers={markers}
          uiSettings={{ myLocationButtonEnabled: false, compassEnabled: false }}
        />
      ) : (
        <GoogleMaps.View
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          markers={markers}
          uiSettings={{ myLocationButtonEnabled: false, compassEnabled: false }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    borderRadius: Spacing.two,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
});
