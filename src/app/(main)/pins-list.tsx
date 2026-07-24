import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { usePins } from "@/context/PinsContext";
import type { Pin } from "@/types/pin";

function PinRow({ pin, onDelete }: { pin: Pin; onDelete: (id: string) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <ThemedText type="smallBold" color="text">
          {pin.label}
        </ThemedText>
        <ThemedText type="small" color="textSecondary">
          {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
        </ThemedText>
      </View>
      <Pressable style={styles.deleteButton} onPress={() => onDelete(pin.id)}>
        <ThemedText color="danger" type="smallBold">
          Delete
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function PinsListScreen() {
  const { pins, removePin, isLoading } = usePins();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle" color="teal">
            Your Pins
          </ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText color="textSecondary" type="smallBold">
              Close
            </ThemedText>
          </Pressable>
        </View>

        {!isLoading && pins.length === 0 ? (
          <ThemedText color="textSecondary" style={styles.empty}>
            No pins yet. Place one from the camera view.
          </ThemedText>
        ) : (
          <FlatList
            data={pins}
            keyExtractor={(pin) => pin.id}
            renderItem={({ item }) => <PinRow pin={item} onDelete={removePin} />}
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  empty: {
    marginTop: Spacing.six,
    textAlign: "center",
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
  },
  rowText: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  deleteButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
