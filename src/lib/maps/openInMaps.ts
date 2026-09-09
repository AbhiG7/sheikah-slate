import { Linking, Platform } from "react-native";

export type MapsProvider = "apple" | "google";

export interface Destination {
  latitude: number;
  longitude: number;
  label?: string;
}

export const PROVIDER_LABEL: Record<MapsProvider, string> = {
  apple: "Apple Maps",
  google: "Google Maps",
};

/**
 * Scheme probed with canOpenURL to decide whether a provider's app is
 * installed. On iOS every scheme queried this way must also be listed in
 * LSApplicationQueriesSchemes (see app.json), or canOpenURL returns false
 * even when the app is present.
 */
const PROBE_SCHEME: Record<MapsProvider, string> = {
  apple: "maps://",
  google: Platform.OS === "ios" ? "comgooglemaps://" : "geo:0,0",
};

/**
 * Candidate URLs per provider, most preferred first. Each list ends in a
 * plain https URL so a provider still works when its native app is absent.
 * Destinations are passed as raw coordinates rather than the pin label, so
 * the maps app routes to the exact spot instead of geocoding a name.
 */
function buildUrls(provider: MapsProvider, { latitude, longitude, label }: Destination): string[] {
  const coords = `${latitude},${longitude}`;

  if (provider === "apple") {
    return [`maps://?daddr=${coords}&dirflg=d`, `https://maps.apple.com/?daddr=${coords}&dirflg=d`];
  }

  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${coords}`;

  if (Platform.OS === "ios") {
    return [`comgooglemaps://?daddr=${coords}&directionsmode=driving`, googleWeb];
  }

  return [
    `google.navigation:q=${coords}`,
    `geo:0,0?q=${coords}(${encodeURIComponent(label || "Pin")})`,
    googleWeb,
  ];
}

/** Providers worth offering on this platform, filtered to what's installed. */
export async function getAvailableProviders(): Promise<MapsProvider[]> {
  // Apple Maps only exists on iOS; Google is offered everywhere because it
  // always has a usable https fallback.
  const candidates: MapsProvider[] = Platform.OS === "ios" ? ["apple", "google"] : ["google"];

  const results = await Promise.all(
    candidates.map(async (provider) => {
      if (provider === "google" && Platform.OS !== "ios") return provider;
      try {
        return (await Linking.canOpenURL(PROBE_SCHEME[provider])) ? provider : null;
      } catch {
        return null;
      }
    })
  );

  const available = results.filter((p): p is MapsProvider => p !== null);
  // Never strand the user with no way out: Google's web URL always opens.
  return available.length > 0 ? available : ["google"];
}

/** Opens directions in the chosen provider, cascading through its fallbacks. */
export async function openInMaps(
  provider: MapsProvider,
  destination: Destination
): Promise<boolean> {
  for (const url of buildUrls(provider, destination)) {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      // try the next candidate
    }
  }

  return false;
}
