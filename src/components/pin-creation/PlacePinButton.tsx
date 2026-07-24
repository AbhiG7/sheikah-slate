import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

interface PlacePinButtonProps {
  onPress: () => void;
}

export function PlacePinButton({ onPress }: PlacePinButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <ThemedText color="background" type="subtitle" style={styles.plus}>
        +
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.teal,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  plus: {
    fontSize: 30,
    lineHeight: 32,
  },
});
