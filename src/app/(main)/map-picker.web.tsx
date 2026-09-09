import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";

/**
 * expo-maps is iOS and Android only, with no web implementation at all, so
 * the map picker cannot render in a browser. The web build gets this notice
 * instead of failing to resolve the native module.
 */
export default function MapPickerWebScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" color="teal">
          Map picker is device-only
        </ThemedText>
        <ThemedText type="small" color="textSecondary" style={styles.body}>
          Native maps are not available in a browser. Open the app on a phone
          to place a pin from the map.
        </ThemedText>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <ThemedText color="background" type="smallBold">
            Go Back
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
  },
  body: { textAlign: "center", maxWidth: 380 },
  button: {
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
