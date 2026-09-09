import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";

export default function OnboardingWelcome() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <ThemedText type="title" color="teal" style={styles.title}>
            Sheikah Slate
          </ThemedText>
          <ThemedText color="textSecondary" style={styles.subtitle}>
            Mark real-world locations and see them as light beams through
            your camera, from across the street to across the horizon.
          </ThemedText>
        </View>

        <View style={styles.bullets}>
          <ThemedText color="text">
            To do this, Sheikah Slate needs access to your camera, your
            location, and your device&apos;s motion sensors.
          </ThemedText>
        </View>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/onboarding/camera-permission")}
        >
          <ThemedText color="background" type="smallBold">
            Get Started
          </ThemedText>
        </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: "space-between",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  hero: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    letterSpacing: 1,
  },
  subtitle: {
    lineHeight: 24,
  },
  bullets: {
    gap: Spacing.two,
  },
  button: {
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginBottom: Spacing.four,
  },
});
