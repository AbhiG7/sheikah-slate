import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { usePermissions } from "@/context/PermissionsContext";

export default function OnboardingComplete() {
  const { completeOnboarding } = usePermissions();

  useEffect(() => {
    completeOnboarding().then(() => {
      router.replace("/(main)/camera");
    });
  }, [completeOnboarding]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" color="teal">
          Sensor calibrated.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "center", alignItems: "center" },
});
