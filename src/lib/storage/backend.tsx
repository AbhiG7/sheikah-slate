import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useMemo } from "react";

import { DATABASE_NAME, migrateDbIfNeeded } from "./db";
import {
  createPin,
  deletePin,
  getAllPins,
  updatePin,
} from "./pinsRepository";
import type { PinsBackend } from "./types";

/** Native persistence: SQLite, migrated on first open. */
export function PinsBackendProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
}

export function usePinsBackend(): PinsBackend {
  const db = useSQLiteContext();

  return useMemo(
    () => ({
      getAll: () => getAllPins(db),
      create: (input) => createPin(db, input),
      update: (id, patch) => updatePin(db, id, patch),
      remove: (id) => deletePin(db, id),
    }),
    [db]
  );
}
