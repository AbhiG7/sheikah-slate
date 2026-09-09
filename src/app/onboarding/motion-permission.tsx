import { router } from "expo-router";

import { PermissionCard } from "@/components/onboarding/PermissionCard";
import { ThemedView } from "@/components/themed-view";
import { usePermissions } from "@/context/PermissionsContext";

export default function MotionPermissionScreen() {
  const { motion, requestMotion, refresh } = usePermissions();

  // No special-casing for Android, where motion needs no runtime prompt and
  // so reports granted immediately: the card's auto-advance carries the user
  // straight through. Handling it here as well would fire two navigations.
  return (
    <ThemedView style={{ flex: 1 }}>
      <PermissionCard
        title="Motion & Compass Access"
        description="Sheikah Slate reads your device's compass and tilt to figure out which way you're pointing the camera, so beams line up correctly as you pan and tilt your phone."
        state={motion}
        onRequest={requestMotion}
        onRecheck={refresh}
        onContinue={() => router.replace("/onboarding/complete")}
      />
    </ThemedView>
  );
}
