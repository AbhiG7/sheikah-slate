import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

import { CircularEma } from "@/lib/heading/circularSmoothing";
import { GRAVITY_Z_SIGN, GravityFilter, pitchFromGravity } from "@/lib/terrain/attitude";

export interface OrientationValues {
  headingDeg: SharedValue<number>;
  pitchDeg: SharedValue<number>;
  read: () => { headingDeg: number; pitchDeg: number };
}

const MOTION_INTERVAL_MS = 16;

/**
 * Camera orientation written straight into shared values.
 *
 * Native counterpart of the web hook: sensors are mutated in place rather
 * than pushed through React state, so a reading reaches the screen without
 * re-rendering the viewfinder. CoreLocation already supplies a fused,
 * north-referenced heading, so no north-lock correction is needed here.
 */
export function useOrientationValues(): OrientationValues {
  const headingDeg = useSharedValue(0);
  const pitchDeg = useSharedValue(0);

  const headingEma = useRef(new CircularEma(0.35));
  const gravity = useRef(new GravityFilter(0.2));

  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;

    Location.watchHeadingAsync((reading) => {
      const raw = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
      if (raw < 0) return;
      headingDeg.value = headingEma.current.next(raw);
    }).then((subscription) => {
      headingSubscription = subscription;
    });

    DeviceMotion.setUpdateInterval(MOTION_INTERVAL_MS);
    const motionSubscription = DeviceMotion.addListener((measurement) => {
      const reading = measurement.accelerationIncludingGravity;
      if (!reading) return;

      const smoothed = gravity.current.next({
        x: reading.x ?? 0,
        y: reading.y ?? 0,
        z: reading.z ?? 0,
      });
      pitchDeg.value = pitchFromGravity(smoothed, GRAVITY_Z_SIGN);
    });

    return () => {
      headingSubscription?.remove();
      motionSubscription.remove();
    };
  }, [headingDeg, pitchDeg]);

  return {
    headingDeg,
    pitchDeg,
    read: () => ({ headingDeg: headingDeg.value, pitchDeg: pitchDeg.value }),
  };
}
