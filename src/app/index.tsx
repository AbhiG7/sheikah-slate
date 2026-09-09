import { Redirect } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import {
  usePermissions,
  type RequiredPermission,
} from "@/context/PermissionsContext";

// `as const` keeps these as literal types so expo-router's typed Href
// accepts them without a cast.
const PERMISSION_ROUTE = {
  camera: "/onboarding/camera-permission",
  location: "/onboarding/location-permission",
  motion: "/onboarding/motion-permission",
} as const satisfies Record<RequiredPermission, string>;

export default function RootIndex() {
  const { isLoading, onboardingComplete, firstMissingPermission } =
    usePermissions();

  // The slate stays up over this, so a blank frame is never visible.
  if (isLoading) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  // First run gets the full explanation before any system prompt appears.
  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  // A returning user whose permission was revoked between launches goes
  // straight to the one that needs granting, rather than back through the
  // whole introduction. Granting it auto-advances through the rest.
  if (firstMissingPermission) {
    return <Redirect href={PERMISSION_ROUTE[firstMissingPermission]} />;
  }

  return <Redirect href="/(main)/camera" />;
}
