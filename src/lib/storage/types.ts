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
