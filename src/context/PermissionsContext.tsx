import { useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

import {
  getOnboardingComplete,
  setOnboardingComplete,
} from "@/lib/permissions/permissions";

export type PermissionState = "undetermined" | "granted" | "denied";

/** Permissions the viewfinder cannot function without. */
export type RequiredPermission = "camera" | "location" | "motion";

interface PermissionsContextValue {
  camera: PermissionState;
  location: PermissionState;
  motion: PermissionState;
  onboardingComplete: boolean;
  isLoading: boolean;
  requestCamera: () => Promise<PermissionState>;
  requestLocation: () => Promise<PermissionState>;
  requestMotion: () => Promise<PermissionState>;
  /**
   * First permission still missing, checked fresh on every boot so a
   * permission revoked in system settings between runs sends the user back
   * to ask for it rather than into a dead viewfinder. Null when all are set.
   */
  firstMissingPermission: RequiredPermission | null;
  refresh: () => void;
  completeOnboarding: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

function toState(granted: boolean, canAskAgain: boolean): PermissionState {
  if (granted) return "granted";
  return canAskAgain ? "undetermined" : "denied";
}

// Android has no runtime prompt for device motion access, so it's treated
// as granted the moment the app starts.
const INITIAL_MOTION_STATE: PermissionState =
  Platform.OS === "android" ? "granted" : "undetermined";

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [cameraPermission, requestCameraPermission, getCameraPermission] =
    useCameraPermissions();
  const [locationPermission, requestLocationPermission, getLocationPermission] =
    Location.useForegroundPermissions();
  const [motion, setMotion] = useState<PermissionState>(INITIAL_MOTION_STATE);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [flagLoading, setFlagLoading] = useState(true);

  // The permission hooks report null until they have read the OS. Treating
  // that as "undetermined" would bounce a fully-granted user into
  // onboarding on every launch, so hydration is part of loading.
  const permissionsHydrated =
    cameraPermission !== null && locationPermission !== null;
  const isLoading = flagLoading || !permissionsHydrated;

  useEffect(() => {
    getOnboardingComplete()
      .then(setOnboardingCompleteState)
      .finally(() => setFlagLoading(false));
  }, []);

  const refreshMotion = useCallback(() => {
    if (Platform.OS !== "ios") return;
    DeviceMotion.getPermissionsAsync().then((res) =>
      setMotion(toState(res.granted, res.canAskAgain))
    );
  }, []);

  useEffect(() => {
    refreshMotion();
  }, [refreshMotion]);

  /** Re-reads every permission from the OS. */
  const refresh = useCallback(() => {
    getCameraPermission();
    getLocationPermission();
    refreshMotion();
  }, [getCameraPermission, getLocationPermission, refreshMotion]);

  // expo's permission hooks only update when asked, so a permission granted
  // outside the app (via Open Settings) would otherwise still read as denied
  // on return. Re-check whenever the app comes back to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const camera: PermissionState = cameraPermission
    ? toState(cameraPermission.granted, cameraPermission.canAskAgain)
    : "undetermined";

  const location: PermissionState = locationPermission
    ? toState(locationPermission.granted, locationPermission.canAskAgain)
    : "undetermined";

  const requestCamera = useCallback(async () => {
    const res = await requestCameraPermission();
    return toState(res.granted, res.canAskAgain);
  }, [requestCameraPermission]);

  const requestLocation = useCallback(async () => {
    const res = await requestLocationPermission();
    return toState(res.granted, res.canAskAgain);
  }, [requestLocationPermission]);

  const requestMotion = useCallback(async () => {
    if (Platform.OS !== "ios") {
      setMotion("granted");
      return "granted" as const;
    }
    const res = await DeviceMotion.requestPermissionsAsync();
    const state = toState(res.granted, res.canAskAgain);
    setMotion(state);
    return state;
  }, []);

  /**
   * Motion is only gated on native iOS, the one platform where it is a real
   * persisted OS permission. Android needs no runtime prompt, and on web the
   * granted state is synthetic and not persisted, so gating on it there
   * would send the user to the motion screen on every single launch.
   */
  const firstMissingPermission: RequiredPermission | null = useMemo(() => {
    if (camera !== "granted") return "camera";
    if (location !== "granted") return "location";
    if (Platform.OS === "ios" && motion !== "granted") return "motion";
    return null;
  }, [camera, location, motion]);

  const completeOnboarding = useCallback(async () => {
    await setOnboardingComplete();
    setOnboardingCompleteState(true);
  }, []);

  const value = useMemo(
    () => ({
      camera,
      location,
      motion,
      onboardingComplete,
      isLoading,
      requestCamera,
      requestLocation,
      requestMotion,
      firstMissingPermission,
      refresh,
      completeOnboarding,
    }),
    [
      camera,
      location,
      motion,
      onboardingComplete,
      isLoading,
      requestCamera,
      requestLocation,
      requestMotion,
      firstMissingPermission,
      refresh,
      completeOnboarding,
    ]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return ctx;
}
