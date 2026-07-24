import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_FOV_MULTIPLIER,
  getFovMultiplier,
  setFovMultiplier,
} from "@/lib/geo/fovCalibration";

export function useFovMultiplier(): [number, (value: number) => void] {
  const [multiplier, setMultiplier] = useState(DEFAULT_FOV_MULTIPLIER);

  useEffect(() => {
    getFovMultiplier().then(setMultiplier);
  }, []);

  const update = useCallback((value: number) => {
    setMultiplier(value);
    setFovMultiplier(value);
  }, []);

  return [multiplier, update];
}
