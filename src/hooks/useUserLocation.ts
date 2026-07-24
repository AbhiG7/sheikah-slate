import * as Location from "expo-location";
import { useEffect, useState } from "react";

export interface UserLocationState {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
  } | null;
  accuracy: number | null;
  error: string | null;
}

export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>({
    coords: null,
    accuracy: null,
    error: null,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1000,
      },
      (location) => {
        if (cancelled) return;
        setState({
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
          },
          accuracy: location.coords.accuracy,
          error: null,
        });
      }
    )
      .then((sub) => {
        subscription = sub;
      })
      .catch((err) => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, error: String(err) }));
        }
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return state;
}
