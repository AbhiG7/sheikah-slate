import { Platform } from "react-native";

/**
 * Sheikah Slate is a single always-dark tech interface (like the in-game
 * device), not a light/dark adaptive UI, so there is one palette rather
 * than light/dark variants.
 */
export const Colors = {
  background: "#0A1416",
  backgroundElement: "#12242699",
  backgroundElevated: "#16292C",
  border: "#1F3A3E",
  teal: "#3FE0D0",
  tealDim: "#1F7A70",
  gold: "#E8C468",
  danger: "#E0654F",
  text: "#EAF6F5",
  textSecondary: "#7FA8A4",
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    mono: "monospace",
  },
}) as { sans: string; mono: string };

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
