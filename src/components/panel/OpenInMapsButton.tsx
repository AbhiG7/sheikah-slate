import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import {
  getAvailableProviders,
  openInMaps,
  PROVIDER_LABEL,
  type MapsProvider,
} from "@/lib/maps/openInMaps";

interface OpenInMapsButtonProps {
  latitude: number;
  longitude: number;
  label: string;
}

export function OpenInMapsButton({ latitude, longitude, label }: OpenInMapsButtonProps) {
  const [providers, setProviders] = useState<MapsProvider[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Probing installed maps apps is inherently async and one-shot.
    getAvailableProviders().then((available) => {
      if (!cancelled) setProviders(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (providers.length === 0) return null;

  const isSingle = providers.length === 1;

  return (
    <View style={styles.row}>
      {providers.map((provider) => (
        <Pressable
          key={provider}
          style={[styles.button, isSingle ? styles.solid : styles.outlined]}
          onPress={() => openInMaps(provider, { latitude, longitude, label })}
        >
          <ThemedText color={isSingle ? "background" : "teal"} type="smallBold">
            {isSingle ? `Open in ${PROVIDER_LABEL[provider]}` : PROVIDER_LABEL[provider]}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: Colors.teal,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.teal,
    backgroundColor: Colors.backgroundElement,
  },
});
