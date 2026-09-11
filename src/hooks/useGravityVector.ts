import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

import { GravityFilter, type Vector3 } from "@/lib/terrain/attitude";

const UPDATE_INTERVAL_MS = 100;

/**
 * Smoothed gravity vector in device coordinates, or null before the first
 * reading arrives.
 *
 * The raw sensor primitive that both pitch and the diagnostics readout are
 * built on, so neither has to touch a platform sensor API directly.
 */
export function useGravityVector(): Vector3 | null {
  const [gravity, setGravity] = useState<Vector3 | null>(null);
  const filterRef = useRef(new GravityFilter());

  useEffect(() => {
    const filter = filterRef.current;
    filter.reset();

    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
    const subscription = DeviceMotion.addListener((measurement) => {
      const reading = measurement.accelerationIncludingGravity;
      if (!reading) return;

      setGravity(
        filter.next({
          x: reading.x ?? 0,
          y: reading.y ?? 0,
          z: reading.z ?? 0,
        })
      );
    });

    return () => subscription.remove();
  }, []);

  return gravity;
}
