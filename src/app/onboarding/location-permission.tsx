import { router } from "expo-router";

import { PermissionCard } from "@/components/onboarding/PermissionCard";
import { ThemedView } from "@/components/themed-view";
import { usePermissions } from "@/context/PermissionsContext";

export default function LocationPermissionScreen() {
  const { location, requestLocation, refresh } = usePermissions();

  return (
    <ThemedView style={{ flex: 1 }}>
      <PermissionCard
        title="Location Access"
        description="Sheikah Slate uses your GPS position to place pins and to work out the bearing and distance from you to each pin, so beams point the right way from wherever you're standing."
        state={location}
        onRequest={requestLocation}
        onRecheck={refresh}
        onContinue={() => router.push("/onboarding/motion-permission")}
      />
    </ThemedView>
  );
}
