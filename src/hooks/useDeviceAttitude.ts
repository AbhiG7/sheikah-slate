import { GRAVITY_Z_SIGN, pitchFromGravity } from "@/lib/terrain/attitude";

import { useGravityVector } from "./useGravityVector";

/**
 * Camera pitch in degrees, positive above the horizon.
 *
 * Derived from gravity rather than Euler angles so the reading is
 * unaffected by rolling the phone, which matters in landscape.
 */
export function useDeviceAttitude(): number {
  const gravity = useGravityVector();
  return gravity ? pitchFromGravity(gravity, GRAVITY_Z_SIGN) : 0;
}
