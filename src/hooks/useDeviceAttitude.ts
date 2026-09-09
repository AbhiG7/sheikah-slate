import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

import { GravityFilter, pitchFromGravity } from "@/lib/terrain/attitude";

const UPDATE_INTERVAL_MS = 100;

/**
 * Sign of the device Z axis in the gravity reading. Platforms disagree on
 * this, so it is isolated here as a single constant to flip after checking
 * on hardware: hold the phone upright and confirm pitch reads ~0, then lay
 * it screen-up and confirm pitch reads ~-90.
 */
const GRAVITY_Z_SIGN = 1;

/**
 * Camera pitch in degrees, positive above the horizon.
 *
 * Uses the gravity vector rather than Euler angles so the reading is
 * unaffected by rolling the phone, and so it works on web too, where
 * DeviceMotion reports acceleration but no rotation.
 */
export function useDeviceAttitude(): number {
  const [pitchDeg, setPitchDeg] = useState(0);
  const filterRef = useRef(new GravityFilter());

  useEffect(() => {
    const filter = filterRef.current;
    filter.reset();

    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
    const subscription = DeviceMotion.addListener((measurement) => {
      const reading = measurement.accelerationIncludingGravity;
      if (!reading) return;

      const gravity = filter.next({
        x: reading.x ?? 0,
        y: reading.y ?? 0,
        z: reading.z ?? 0,
      });
      setPitchDeg(pitchFromGravity(gravity, GRAVITY_Z_SIGN));
    });

    return () => subscription.remove();
  }, []);

  return pitchDeg;
}
