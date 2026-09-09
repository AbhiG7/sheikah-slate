import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import type { PermissionState } from "@/context/PermissionsContext";

/** Long enough to read the confirmation, short enough not to feel stalled. */
const AUTO_ADVANCE_MS = 450;

interface PermissionCardProps {
  title: string;
  description: string;
  state: PermissionState;
  onRequest: () => void;
  onContinue: () => void;
  /** Re-reads the OS permission, for returning from system settings. */
  onRecheck?: () => void;
}

export function PermissionCard({
  title,
  description,
  state,
  onRequest,
  onContinue,
  onRecheck,
}: PermissionCardProps) {
  // Held in a ref so the timer below depends only on `state`. Callers pass
  // an inline arrow, which is a fresh function every render; depending on it
  // directly would clear and reschedule the timer on each re-render and
  // could stall the advance indefinitely.
  const onContinueRef = useRef(onContinue);
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  // Granting is the signal to move on; making the user hunt for a Continue
  // button afterwards reads as the screen being stuck. This also skips the
  // step outright when the permission was already granted on a previous run.
  useEffect(() => {
    if (state !== "granted") return;
    const timer = setTimeout(() => onContinueRef.current(), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <ThemedText type="subtitle" color="teal">
          {title}
        </ThemedText>
        <ThemedText color="textSecondary" style={styles.description}>
          {description}
        </ThemedText>

        {state === "granted" ? (
          <View style={styles.grantedBlock}>
            <ThemedText color="teal" type="smallBold">
              Access granted
            </ThemedText>
            <ThemedText color="textSecondary" type="small">
              Continuing...
            </ThemedText>
          </View>
        ) : null}

        {state === "undetermined" ? (
          <Pressable style={styles.primaryButton} onPress={onRequest}>
            <ThemedText color="background" type="smallBold">
              Allow Access
            </ThemedText>
          </Pressable>
        ) : null}

        {state === "denied" ? (
          <View style={styles.deniedBlock}>
            <ThemedText color="danger" type="small">
              Permission was denied. Grant it in your device settings, then
              come back and check again.
            </ThemedText>
            <Pressable style={styles.secondaryButton} onPress={Linking.openSettings}>
              <ThemedText color="text" type="smallBold">
                Open Settings
              </ThemedText>
            </Pressable>
            {onRecheck ? (
              <Pressable style={styles.textButton} onPress={onRecheck}>
                <ThemedText color="teal" type="smallBold">
                  Check Again
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  textButton: {
    paddingVertical: Spacing.two,
    alignItems: "center",
  },
  grantedBlock: {
    alignItems: "center",
    gap: Spacing.half,
    paddingVertical: Spacing.two,
  },
  deniedBlock: {
    gap: Spacing.two,
  },
});
