import { router } from "expo-router";

import { PermissionCard } from "@/components/onboarding/PermissionCard";
import { ThemedView } from "@/components/themed-view";
import { usePermissions } from "@/context/PermissionsContext";

export default function CameraPermissionScreen() {
  const { camera, requestCamera } = usePermissions();

  return (
    <ThemedView style={{ flex: 1 }}>
      <PermissionCard
        title="Camera Access"
        description="Sheikah Slate uses your camera as the main viewfinder, overlaying pin beams over the real world as you look through it."
        state={camera}
        onRequest={requestCamera}
        onContinue={() => router.push("/onboarding/location-permission")}
      />
    </ThemedView>
  );
}
