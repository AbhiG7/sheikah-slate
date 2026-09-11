import { useEffect, useState } from "react";

import { GRAVITY_Z_SIGN, pitchFromGravity } from "@/lib/terrain/attitude";

import { useGravityVector } from "./useGravityVector";

const KEY_STEP_DEG = 1;
const MAX_PITCH_DEG = 25;

/**
 * Camera pitch for the web build.
 *
 * A phone browser reports real gravity, so it uses the identical derivation
 * to native. Desktops have no accelerometer, so arrow keys tilt instead,
 * starting slightly below level to keep a cast ray meeting terrain rather
 * than sailing into the sky.
 */
export function useDeviceAttitude(): number {
  const gravity = useGravityVector();
  const [keyboardPitchDeg, setKeyboardPitchDeg] = useState(-2);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        setKeyboardPitchDeg((previous) =>
          Math.min(MAX_PITCH_DEG, previous + KEY_STEP_DEG)
        );
      } else if (event.key === "ArrowDown") {
        setKeyboardPitchDeg((previous) =>
          Math.max(-MAX_PITCH_DEG, previous - KEY_STEP_DEG)
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return gravity ? pitchFromGravity(gravity, GRAVITY_Z_SIGN) : keyboardPitchDeg;
}
