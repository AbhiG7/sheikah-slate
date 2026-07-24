import { Redirect } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { usePermissions } from "@/context/PermissionsContext";

export default function RootIndex() {
  const { isLoading, onboardingComplete } = usePermissions();

  if (isLoading) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  return (
    <Redirect href={onboardingComplete ? "/(main)/camera" : "/onboarding"} />
  );
}
