import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { SheikahBootScreen } from "@/components/boot/SheikahBootScreen";
import { Colors } from "@/constants/theme";
import { PermissionsProvider, usePermissions } from "@/context/PermissionsContext";
import { PinsProvider, usePins } from "@/context/PinsContext";
import { PinsBackendProvider } from "@/lib/storage/backend";

SplashScreen.preventAutoHideAsync();

/**
 * Sits inside the providers so it can see whether start-up work has
 * finished, and holds the slate over the app until it has.
 */
function AppShell() {
  const { isLoading: permissionsLoading } = usePermissions();
  const { isLoading: pinsLoading } = usePins();
  const [bootComplete, setBootComplete] = useState(false);

  const isReady = !permissionsLoading && !pinsLoading;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(main)" />
      </Stack>

      {!bootComplete ? (
        <SheikahBootScreen
          isReady={isReady}
          onFinished={() => setBootComplete(true)}
        />
      ) : null}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hand off from the native splash immediately; our own slate screen
    // renders in the same commit, so there is no flash of bare app.
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PinsBackendProvider>
        <PermissionsProvider>
          <PinsProvider>
            <AppShell />
          </PinsProvider>
        </PermissionsProvider>
      </PinsBackendProvider>
    </GestureHandlerRootView>
  );
}
