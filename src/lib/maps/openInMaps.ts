import { Linking, Platform } from "react-native";

interface OpenDirectionsOptions {
  latitude: number;
  longitude: number;
  label?: string;
}

function buildUrls({ latitude, longitude, label }: OpenDirectionsOptions): string[] {
  const encodedLabel = label ? encodeURIComponent(label) : "";
  const universalFallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  if (Platform.OS === "ios") {
    return [
      `maps://?daddr=${latitude},${longitude}&dirflg=d${encodedLabel ? `&q=${encodedLabel}` : ""}`,
      `https://maps.apple.com/?daddr=${latitude},${longitude}`,
      universalFallback,
    ];
  }

  if (Platform.OS === "android") {
    return [
      `google.navigation:q=${latitude},${longitude}`,
      `geo:0,0?q=${latitude},${longitude}(${encodedLabel || "Pin"})`,
      universalFallback,
    ];
  }

  return [universalFallback];
}

/** Opens the native Maps app for directions, cascading through fallbacks. */
export async function openInMaps(options: OpenDirectionsOptions): Promise<boolean> {
  const urls = buildUrls(options);

  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      // try the next candidate
    }
  }

  return false;
}
