import { useEffect, useRef, useState } from "react";

import { armWebSensorPermission } from "@/lib/sensors/webSensorPermission";
import { GravityFilter, type Vector3 } from "@/lib/terrain/attitude";

/**
 * Smoothed gravity vector from the browser's devicemotion event, or null
 * where there is no accelerometer, which is every desktop.
 *
 * expo-sensors cannot be used here: its web build of DeviceMotion exposes
 * only startObserving, with no addListener, so calling it the way the
 * native module is called throws.
 */
export function useGravityVector(): Vector3 | null {
  const [gravity, setGravity] = useState<Vector3 | null>(null);
  const filterRef = useRef(new GravityFilter());

  useEffect(() => {
    armWebSensorPermission();

    const onMotion = (event: DeviceMotionEvent) => {
      const reading = event.accelerationIncludingGravity;
      if (!reading) return;
      if (reading.x === null && reading.y === null && reading.z === null) return;

      setGravity(
        filterRef.current.next({
          x: reading.x ?? 0,
          y: reading.y ?? 0,
          z: reading.z ?? 0,
        })
      );
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, []);

  return gravity;
}
