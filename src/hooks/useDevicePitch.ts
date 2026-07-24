import { DeviceMotion } from "expo-sensors";
import { useEffect, useState } from "react";

const UPDATE_INTERVAL_MS = 100;

/**
 * Device pitch in degrees, where 0 = phone held upright and level (camera
 * pointing at the horizon), positive = tilted up, negative = tilted down.
 *
 * DeviceMotion's rotation.beta follows the W3C deviceorientation
 * convention (~90deg when the phone is held vertically upright), so we
 * offset by 90deg to get a "level = 0" pitch. The exact offset/sign can
 * drift slightly by platform and needs on-device verification (see plan
 * Phase 3 verification), not something that can be confirmed on a
 * simulator.
 */
export function useDevicePitch(): number {
  const [pitchDeg, setPitchDeg] = useState(0);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
    const subscription = DeviceMotion.addListener((measurement) => {
      const betaRad = measurement.rotation?.beta ?? 0;
      const betaDeg = (betaRad * 180) / Math.PI;
      setPitchDeg(betaDeg - 90);
    });

    return () => subscription.remove();
  }, []);

  return pitchDeg;
}
