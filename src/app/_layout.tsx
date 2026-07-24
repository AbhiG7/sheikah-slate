import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { PermissionsProvider } from "@/context/PermissionsContext";
import { PinsProvider } from "@/context/PinsContext";
import { Colors } from "@/constants/theme";
import { DATABASE_NAME, migrateDbIfNeeded } from "@/lib/storage/db";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <PermissionsProvider>
        <PinsProvider>
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
        </PinsProvider>
      </PermissionsProvider>
    </SQLiteProvider>
  );
}
