import { useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";

const PRESETS_M = [50, 100, 500, 1000, 5000];

interface DistancePickerProps {
  visible: boolean;
  onConfirm: (distanceMeters: number) => void;
  onClose: () => void;
}

export function DistancePicker({ visible, onConfirm, onClose }: DistancePickerProps) {
  const [custom, setCustom] = useState("");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ThemedText type="subtitle" color="teal">
            How far away is it?
          </ThemedText>
          <ThemedText type="small" color="textSecondary">
            This is an estimate — placement accuracy depends on your guess.
          </ThemedText>

          <View style={styles.presetRow}>
            {PRESETS_M.map((meters) => (
              <Pressable
                key={meters}
                style={styles.preset}
                onPress={() => onConfirm(meters)}
              >
                <ThemedText type="smallBold" color="text">
                  {meters < 1000 ? `${meters} m` : `${meters / 1000} km`}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.customRow}>
            <TextInput
              style={styles.input}
              placeholder="Custom distance (m)"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={custom}
              onChangeText={setCustom}
            />
            <Pressable
              style={[styles.confirmButton, !custom && styles.confirmDisabled]}
              disabled={!custom}
              onPress={() => onConfirm(Number(custom))}
            >
              <ThemedText color="background" type="smallBold">
                Use
              </ThemedText>
            </Pressable>
          </View>

          <Pressable style={styles.cancel} onPress={onClose}>
            <ThemedText color="textSecondary" type="smallBold">
              Cancel
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.backgroundElevated,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  preset: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  customRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    color: Colors.text,
  },
  confirmButton: {
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
});
