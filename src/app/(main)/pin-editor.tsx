import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { usePins } from "@/context/PinsContext";
import type { PinSourceMode } from "@/types/pin";

const SOURCE_MODE_LABEL: Record<PinSourceMode, string> = {
  current_location: "Pinned at your location",
  map_pick: "Pinned on map",
  aim_distance: "Estimated by aim + distance",
};

export default function PinEditorScreen() {
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    altitude?: string;
    sourceMode: PinSourceMode;
  }>();
  const { addPin } = usePins();
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const latitude = Number(params.latitude);
  const longitude = Number(params.longitude);
  const altitude = params.altitude ? Number(params.altitude) : null;
  const sourceMode = params.sourceMode;

  const handleSave = async () => {
    if (!label.trim()) return;
    setIsSaving(true);
    try {
      await addPin({
        label: label.trim(),
        latitude,
        longitude,
        altitude,
        notes: notes.trim() || null,
        sourceMode,
      });
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" color="teal">
          Name This Pin
        </ThemedText>
        <ThemedText type="small" color="textSecondary">
          {SOURCE_MODE_LABEL[sourceMode] ?? "New pin"} &middot;{" "}
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Label (e.g. Death Mountain)"
          placeholderTextColor={Colors.textSecondary}
          value={label}
          onChangeText={setLabel}
          autoFocus
        />
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notes (optional)"
          placeholderTextColor={Colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.buttonRow}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <ThemedText color="textSecondary" type="smallBold">
              Cancel
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.saveButton, !label.trim() && styles.saveDisabled]}
            onPress={handleSave}
            disabled={!label.trim() || isSaving}
          >
            <ThemedText color="background" type="smallBold">
              {isSaving ? "Saving..." : "Save Pin"}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  input: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    color: Colors.text,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: "auto",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.three,
  },
  saveButton: {
    flex: 2,
    alignItems: "center",
    paddingVertical: Spacing.three,
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
  },
  saveDisabled: {
    opacity: 0.4,
  },
});
