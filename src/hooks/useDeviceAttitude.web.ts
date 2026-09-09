import { useEffect, useRef, useState } from "react";

import { armWebSensorPermission } from "@/lib/sensors/webSensorPermission";
import { GravityFilter, pitchFromGravity } from "@/lib/terrain/attitude";

const KEY_STEP_DEG = 1;
const MAX_PITCH_DEG = 25;

/**
 * Camera pitch for the web build.
 *
 * On a phone browser this uses the same gravity-vector derivation as the
 * native hook, since DeviceMotionEvent does report
 * accelerationIncludingGravity on web. That keeps the reading
 * roll-invariant, which matters in landscape.
 *
 * Desktop browsers have no accelerometer, so up and down arrow keys tilt
 * instead, starting slightly below level so a cast ray meets terrain rather
 * than sailing into the sky.
 */
export function useDeviceAttitude(): number {
  const [pitchDeg, setPitchDeg] = useState(-2);
  const filterRef = useRef(new GravityFilter());
  const hasRealSensorRef = useRef(false);

  useEffect(() => {
    armWebSensorPermission();

    const onMotion = (event: DeviceMotionEvent) => {
      const reading = event.accelerationIncludingGravity;
      if (!reading || reading.x === null || reading.y === null || reading.z === null) {
        return;
      }

      const gravity = filterRef.current.next({
        x: reading.x ?? 0,
        y: reading.y ?? 0,
        z: reading.z ?? 0,
      });

      hasRealSensorRef.current = true;
      setPitchDeg(pitchFromGravity(gravity));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (hasRealSensorRef.current) return;
      if (event.key === "ArrowUp") {
        setPitchDeg((previous) => Math.min(MAX_PITCH_DEG, previous + KEY_STEP_DEG));
      } else if (event.key === "ArrowDown") {
        setPitchDeg((previous) => Math.max(-MAX_PITCH_DEG, previous - KEY_STEP_DEG));
      }
    };

    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return pitchDeg;
}
