import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

import { CircularEma } from "@/lib/heading/circularSmoothing";

const FALLBACK_TIMEOUT_MS = 3000;

/**
 * Smoothed device compass heading in degrees [0, 360). Primary source is
 * the OS-fused Location.watchHeadingAsync (accounts for tilt, uses sensor
 * fusion); if it never delivers a reading within FALLBACK_TIMEOUT_MS (no
 * compass hardware, or the API misbehaving on a given device), falls back
 * to raw Magnetometer atan2(y, x). The raw fallback assumes the phone is
 * held roughly upright/level and is meaningfully less accurate.
 */
export function useCompassHeading(): number {
  const [headingDeg, setHeadingDeg] = useState(0);
  const emaRef = useRef(new CircularEma());
  const hasReceivedHeadingRef = useRef(false);

  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;
    let magnetometerSubscription: ReturnType<typeof Magnetometer.addListener> | null =
      null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const startMagnetometerFallback = () => {
      if (magnetometerSubscription) return;
      Magnetometer.setUpdateInterval(100);
      magnetometerSubscription = Magnetometer.addListener(({ x, y }) => {
        if (hasReceivedHeadingRef.current) return;
        const rawDeg = (Math.atan2(y, x) * 180) / Math.PI;
        const normalized = (rawDeg + 360) % 360;
        setHeadingDeg(emaRef.current.next(normalized));
      });
    };

    Location.watchHeadingAsync((reading) => {
      const raw = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
      if (raw < 0) return;

      hasReceivedHeadingRef.current = true;
      if (magnetometerSubscription) {
        magnetometerSubscription.remove();
        magnetometerSubscription = null;
      }
      setHeadingDeg(emaRef.current.next(raw));
    }).then((sub) => {
      headingSubscription = sub;
    });

    fallbackTimer = setTimeout(() => {
      if (!hasReceivedHeadingRef.current) startMagnetometerFallback();
    }, FALLBACK_TIMEOUT_MS);

    return () => {
      headingSubscription?.remove();
      magnetometerSubscription?.remove();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return headingDeg;
}
