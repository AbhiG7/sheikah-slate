import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_COMPLETE_KEY = "sheikah-slate:onboarding-complete";

export async function getOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === "true";
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}
