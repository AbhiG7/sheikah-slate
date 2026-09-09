import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo } from "react";

import type { CreatePinInput, Pin, UpdatePinInput } from "@/types/pin";

import type { PinsBackend } from "./types";

const STORAGE_KEY = "sheikah-slate:pins";

/**
 * Web persistence: a JSON array in AsyncStorage, which is localStorage on
 * web. Deliberately not expo-sqlite, whose web build needs a WASM worker
 * that Metro's dev server cannot chunk and that only runs on a
 * cross-origin isolated page. The pin set is small enough that reading and
 * rewriting the whole array costs nothing.
 */
async function readAll(): Promise<Pin[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Pin[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(pins: Pin[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
}

function newId(): string {
  // crypto.randomUUID needs a secure context; fall back for plain http.
  const maybeCrypto = globalThis.crypto as Crypto | undefined;
  if (maybeCrypto?.randomUUID) return maybeCrypto.randomUUID();
  return `pin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** No database to open on web, so this is a pass-through. */
export function PinsBackendProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function usePinsBackend(): PinsBackend {
  return useMemo(
    () => ({
      getAll: async () => {
        const pins = await readAll();
        return [...pins].sort((a, b) => b.createdAt - a.createdAt);
      },

      create: async (input: CreatePinInput) => {
        const now = Date.now();
        const pin: Pin = {
          id: newId(),
          label: input.label,
          latitude: input.latitude,
          longitude: input.longitude,
          altitude: input.altitude ?? null,
          notes: input.notes ?? null,
          color: input.color ?? null,
          sourceMode: input.sourceMode,
          createdAt: now,
          updatedAt: now,
        };
        await writeAll([...(await readAll()), pin]);
        return pin;
      },

      update: async (id: string, patch: UpdatePinInput) => {
        const pins = await readAll();
        const index = pins.findIndex((pin) => pin.id === id);
        if (index === -1) throw new Error(`Pin not found: ${id}`);

        pins[index] = { ...pins[index], ...patch, updatedAt: Date.now() };
        await writeAll(pins);
      },

      remove: async (id: string) => {
        const pins = await readAll();
        await writeAll(pins.filter((pin) => pin.id !== id));
      },
    }),
    []
  );
}
