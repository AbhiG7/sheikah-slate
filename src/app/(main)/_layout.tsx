import { Stack } from "expo-router";

import { Colors } from "@/constants/theme";

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="camera" />
      <Stack.Screen name="pins-list" options={{ presentation: "modal" }} />
      <Stack.Screen name="pin-editor" options={{ presentation: "modal" }} />
      <Stack.Screen name="map-picker" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="diagnostics" options={{ presentation: "modal" }} />
    </Stack>
  );
}
