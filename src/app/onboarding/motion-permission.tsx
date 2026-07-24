import { router } from "expo-router";
import { useEffect } from "react";

import { PermissionCard } from "@/components/onboarding/PermissionCard";
import { ThemedView } from "@/components/themed-view";
import { usePermissions } from "@/context/PermissionsContext";

export default function MotionPermissionScreen() {
  const { motion, requestMotion } = usePermissions();

  // Android has no runtime motion permission, so this step is a no-op there.
  useEffect(() => {
    if (motion === "granted") {
      router.replace("/onboarding/complete");
    }
  }, [motion]);

  if (motion === "granted") {
    return <ThemedView style={{ flex: 1 }} />;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <PermissionCard
        title="Motion & Compass Access"
        description="Sheikah Slate reads your device's compass and tilt to figure out which way you're pointing the camera, so beams line up correctly as you pan and tilt your phone."
        state={motion}
        onRequest={requestMotion}
        onContinue={() => router.push("/onboarding/complete")}
      />
    </ThemedView>
  );
}
