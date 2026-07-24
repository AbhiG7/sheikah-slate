import * as Linking from "expo-linking";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import type { PermissionState } from "@/context/PermissionsContext";

interface PermissionCardProps {
  title: string;
  description: string;
  state: PermissionState;
  onRequest: () => void;
  onContinue: () => void;
}

export function PermissionCard({
  title,
  description,
  state,
  onRequest,
  onContinue,
}: PermissionCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="subtitle" color="teal">
          {title}
        </ThemedText>
        <ThemedText color="textSecondary" style={styles.description}>
          {description}
        </ThemedText>

        {state === "denied" ? (
          <View style={styles.deniedBlock}>
            <ThemedText color="danger" type="small">
              Permission was denied. You can grant it from your device
              settings and come back here.
            </ThemedText>
            <Pressable style={styles.secondaryButton} onPress={Linking.openSettings}>
              <ThemedText color="text" type="smallBold">
                Open Settings
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.primaryButton} onPress={onRequest}>
            <ThemedText color="background" type="smallBold">
              {state === "granted" ? "Granted" : "Allow Access"}
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={[styles.continueButton, state !== "granted" && styles.continueDisabled]}
          onPress={onContinue}
          disabled={state !== "granted"}
        >
          <ThemedText
            color={state === "granted" ? "teal" : "textSecondary"}
            type="smallBold"
          >
            Continue
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
  },
  card: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  description: {
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: Colors.teal,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deniedBlock: {
    gap: Spacing.two,
  },
  continueButton: {
    paddingVertical: Spacing.two,
    alignItems: "center",
  },
  continueDisabled: {
    opacity: 0.4,
  },
});
