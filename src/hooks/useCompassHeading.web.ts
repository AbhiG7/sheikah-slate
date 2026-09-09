import { useEffect, useRef, useState } from "react";

import { CircularEma } from "@/lib/heading/circularSmoothing";
import { armWebSensorPermission } from "@/lib/sensors/webSensorPermission";

const KEY_STEP_DEG = 3;

interface WebOrientationEvent extends DeviceOrientationEvent {
  /** WebKit-only true heading, the good fused value on iOS Safari. */
  webkitCompassHeading?: number;
}

/**
 * Compass heading for the web build.
 *
 * On a phone browser this is a real compass: iOS Safari exposes
 * webkitCompassHeading, already fused and referenced to true north, and
 * Android reports absolute alpha via deviceorientationabsolute. Neither
 * expo-location's watchDeviceHeading nor expo-sensors' Magnetometer works
 * on web, so reading the DOM event directly is the only route.
 *
 * Desktop browsers report no orientation at all, so left and right arrow
 * keys pan the heading instead, which keeps the viewfinder inspectable on
 * a laptop.
 */
export function useCompassHeading(): number {
  const [headingDeg, setHeadingDeg] = useState(0);
  const emaRef = useRef(new CircularEma());
  const hasRealSensorRef = useRef(false);

  useEffect(() => {
    armWebSensorPermission();

    const onOrientation = (event: Event) => {
      const reading = event as WebOrientationEvent;

      let raw: number | null = null;
      if (typeof reading.webkitCompassHeading === "number") {
        raw = reading.webkitCompassHeading;
      } else if (reading.absolute && typeof reading.alpha === "number") {
        // Absolute alpha runs anticlockwise from north.
        raw = (360 - reading.alpha) % 360;
      }

      if (raw === null || Number.isNaN(raw)) return;

      hasRealSensorRef.current = true;
      setHeadingDeg(emaRef.current.next(raw));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (hasRealSensorRef.current) return;
      if (event.key === "ArrowLeft") {
        setHeadingDeg((previous) => (previous - KEY_STEP_DEG + 360) % 360);
      } else if (event.key === "ArrowRight") {
        setHeadingDeg((previous) => (previous + KEY_STEP_DEG) % 360);
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
  }, []);

  return headingDeg;
}
