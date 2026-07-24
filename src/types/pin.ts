export type PinSourceMode = "current_location" | "map_pick" | "aim_distance";

export interface Pin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  notes: string | null;
  color: string | null;
  sourceMode: PinSourceMode;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePinInput {
  label: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  notes?: string | null;
  color?: string | null;
  sourceMode: PinSourceMode;
}

export type UpdatePinInput = Partial<
  Omit<CreatePinInput, "sourceMode">
>;
