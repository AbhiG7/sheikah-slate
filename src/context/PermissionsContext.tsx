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
import { Platform } from "react-native";

import {
  getOnboardingComplete,
  setOnboardingComplete,
} from "@/lib/permissions/permissions";

export type PermissionState = "undetermined" | "granted" | "denied";

interface PermissionsContextValue {
  camera: PermissionState;
  location: PermissionState;
  motion: PermissionState;
  onboardingComplete: boolean;
  isLoading: boolean;
  requestCamera: () => Promise<PermissionState>;
  requestLocation: () => Promise<PermissionState>;
  requestMotion: () => Promise<PermissionState>;
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
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] =
    Location.useForegroundPermissions();
  const [motion, setMotion] = useState<PermissionState>(INITIAL_MOTION_STATE);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getOnboardingComplete()
      .then(setOnboardingCompleteState)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    DeviceMotion.getPermissionsAsync().then((res) =>
      setMotion(toState(res.granted, res.canAskAgain))
    );
  }, []);

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
