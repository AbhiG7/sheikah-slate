import { useEffect, useRef } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

import { CircularEma } from "@/lib/heading/circularSmoothing";
import { cameraOrientation } from "@/lib/sensors/orientation";
import { armWebSensorPermission } from "@/lib/sensors/webSensorPermission";

export interface OrientationValues {
  headingDeg: SharedValue<number>;
  pitchDeg: SharedValue<number>;
  /** Reads the current values from JS, for one-shot work like a tap. */
  read: () => { headingDeg: number; pitchDeg: number };
}

const KEY_STEP_DEG = 3;
const NORTH_LOCK_ALPHA = 0.02;

interface WebOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

/**
 * Camera orientation written straight into shared values.
 *
 * Deliberately never calls setState. Routing 60Hz sensor data through React
 * re-renders the whole viewfinder on every reading, which on a phone browser
 * collapses the frame rate badly enough that beams visibly lag the camera by
 * seconds. Shared values are mutated in place and read by animated styles,
 * so a reading reaches the screen without React reconciling anything.
 *
 * Consequence worth knowing: these values are invisible to React. Nothing
 * re-renders when they change, which is the entire point, so anything that
 * needs them in JS must read them explicitly.
 */
export function useOrientationValues(): OrientationValues {
  const headingDeg = useSharedValue(0);
  const pitchDeg = useSharedValue(-2);

  const northOffset = useRef(new CircularEma(NORTH_LOCK_ALPHA));
  const offsetDeg = useRef<number | null>(null);
  const hasSensor = useRef(false);

  useEffect(() => {
    armWebSensorPermission();

    const onOrientation = (event: Event) => {
      const reading = event as WebOrientationEvent;
      if (reading.alpha === null || reading.beta === null || reading.gamma === null) {
        return;
      }

      const { headingDeg: relative, pitchDeg: pitch } = cameraOrientation(
        reading.alpha,
        reading.beta,
        reading.gamma
      );

      // alpha carries the fast motion; the compass only trims the north
      // reference, slowly, so it cannot reintroduce magnetometer jitter.
      const absolute = reading.webkitCompassHeading;
      if (typeof absolute === "number" && !Number.isNaN(absolute)) {
        offsetDeg.current = northOffset.current.next(
          (((absolute - relative) % 360) + 360) % 360
        );
      }

      hasSensor.current = true;
      headingDeg.value = (((relative + (offsetDeg.current ?? 0)) % 360) + 360) % 360;
      pitchDeg.value = pitch;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (hasSensor.current) return;
      if (event.key === "ArrowLeft") {
        headingDeg.value = (headingDeg.value - KEY_STEP_DEG + 360) % 360;
      } else if (event.key === "ArrowRight") {
        headingDeg.value = (headingDeg.value + KEY_STEP_DEG) % 360;
      } else if (event.key === "ArrowUp") {
        pitchDeg.value = Math.min(25, pitchDeg.value + 1);
      } else if (event.key === "ArrowDown") {
        pitchDeg.value = Math.max(-25, pitchDeg.value - 1);
      }
    };

    window.addEventListener("deviceorientationabsolute", onOrientation);
    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [headingDeg, pitchDeg]);

  return {
    headingDeg,
    pitchDeg,
    read: () => ({ headingDeg: headingDeg.value, pitchDeg: pitchDeg.value }),
  };
}
