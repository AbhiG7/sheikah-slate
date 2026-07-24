import { Modal, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";

export type PinMode = "current_location" | "map_pick" | "aim_distance";

interface PinModeSelectorProps {
  visible: boolean;
  onSelect: (mode: PinMode) => void;
  onClose: () => void;
}

const OPTIONS: { mode: PinMode; title: string; description: string }[] = [
  {
    mode: "current_location",
    title: "Pin My Location",
    description: "Drop a pin exactly where you're standing.",
  },
  {
    mode: "map_pick",
    title: "Choose on Map",
    description: "Tap a spot on the map. Best for distant landmarks.",
  },
  {
    mode: "aim_distance",
    title: "Aim + Distance",
    description: "Point the reticle and estimate how far away it is.",
  },
];

export function PinModeSelector({ visible, onSelect, onClose }: PinModeSelectorProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ThemedText type="subtitle" color="teal" style={styles.heading}>
            New Pin
          </ThemedText>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.mode}
              style={styles.option}
              onPress={() => onSelect(option.mode)}
            >
              <ThemedText type="smallBold" color="text">
                {option.title}
              </ThemedText>
              <ThemedText type="small" color="textSecondary">
                {option.description}
              </ThemedText>
            </Pressable>
          ))}
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
  heading: {
    marginBottom: Spacing.one,
  },
  option: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
});
