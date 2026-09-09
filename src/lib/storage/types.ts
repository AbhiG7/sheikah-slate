import type { CreatePinInput, Pin, UpdatePinInput } from "@/types/pin";

export interface PinRow {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  notes: string | null;
  color: string | null;
  sourceMode: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Platform-agnostic pin persistence. Native backs this with expo-sqlite;
 * web backs it with AsyncStorage, because expo-sqlite's web build pulls in
 * a WASM worker that Metro's dev server cannot chunk and that needs
 * cross-origin isolation to run at all.
 */
export interface PinsBackend {
  getAll: () => Promise<Pin[]>;
  create: (input: CreatePinInput) => Promise<Pin>;
  update: (id: string, patch: UpdatePinInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
