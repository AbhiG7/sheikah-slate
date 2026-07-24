import { useSQLiteContext } from "expo-sqlite";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createPin,
  deletePin,
  getAllPins,
  updatePin,
} from "@/lib/storage/pinsRepository";
import type { CreatePinInput, Pin, UpdatePinInput } from "@/types/pin";

interface PinsContextValue {
  pins: Pin[];
  isLoading: boolean;
  addPin: (input: CreatePinInput) => Promise<Pin>;
  editPin: (id: string, patch: UpdatePinInput) => Promise<void>;
  removePin: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const PinsContext = createContext<PinsContextValue | null>(null);

export function PinsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [pins, setPins] = useState<Pin[] | null>(null);
  const isLoading = pins === null;

  const refresh = useCallback(async () => {
    const all = await getAllPins(db);
    setPins(all);
  }, [db]);

  useEffect(() => {
    // Initial load from SQLite on mount; no Suspense-friendly data layer
    // is in play here, so this is the straightforward fetch-on-mount case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addPin = useCallback(
    async (input: CreatePinInput) => {
      const pin = await createPin(db, input);
      await refresh();
      return pin;
    },
    [db, refresh]
  );

  const editPin = useCallback(
    async (id: string, patch: UpdatePinInput) => {
      await updatePin(db, id, patch);
      await refresh();
    },
    [db, refresh]
  );

  const removePin = useCallback(
    async (id: string) => {
      await deletePin(db, id);
      await refresh();
    },
    [db, refresh]
  );

  const value = useMemo(
    () => ({ pins: pins ?? [], isLoading, addPin, editPin, removePin, refresh }),
    [pins, isLoading, addPin, editPin, removePin, refresh]
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins(): PinsContextValue {
  const ctx = useContext(PinsContext);
  if (!ctx) {
    throw new Error("usePins must be used within a PinsProvider");
  }
  return ctx;
}
