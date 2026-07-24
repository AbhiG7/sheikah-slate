import AsyncStorage from "@react-native-async-storage/async-storage";

const FOV_MULTIPLIER_KEY = "sheikah-slate:fov-multiplier";
export const DEFAULT_FOV_MULTIPLIER = 1.0;
export const MIN_FOV_MULTIPLIER = 0.7;
export const MAX_FOV_MULTIPLIER = 1.4;

export async function getFovMultiplier(): Promise<number> {
  const value = await AsyncStorage.getItem(FOV_MULTIPLIER_KEY);
  const parsed = value ? Number(value) : DEFAULT_FOV_MULTIPLIER;
  return Number.isFinite(parsed) ? parsed : DEFAULT_FOV_MULTIPLIER;
}

export async function setFovMultiplier(multiplier: number): Promise<void> {
  const clamped = Math.min(
    MAX_FOV_MULTIPLIER,
    Math.max(MIN_FOV_MULTIPLIER, multiplier)
  );
  await AsyncStorage.setItem(FOV_MULTIPLIER_KEY, String(clamped));
}
