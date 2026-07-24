export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CoordinatesWithAltitude extends Coordinates {
  altitude: number | null;
}
