import { useEffect, useRef, useState } from "react";

import type { BeamProjection } from "./useBeamProjections";

const FOCUS_THRESHOLD_DEG = 6;
const SWITCH_MARGIN_DEG = 2;
const HOLD_MS = 275;

/**
 * Picks the beam whose horizontal angular distance from the center
 * reticle is smallest, if under FOCUS_THRESHOLD_DEG. A candidate must
 * beat the currently focused pin by SWITCH_MARGIN_DEG and hold that lead
 * for HOLD_MS before the focus actually switches, so two angularly-close
 * pins don't flicker back and forth as sensor noise jitters the readings.
 */
export function useFocusedBeam(projections: BeamProjection[]): string | null {
  const [focusedPinId, setFocusedPinId] = useState<string | null>(null);
  const pendingRef = useRef<{ id: string | null; since: number } | null>(null);

  useEffect(() => {
    let nearest: BeamProjection | null = null;
    for (const projection of projections) {
      const angle = Math.abs(projection.relativeAngleDeg);
      if (angle > FOCUS_THRESHOLD_DEG) continue;
      if (!nearest || angle < Math.abs(nearest.relativeAngleDeg)) {
        nearest = projection;
      }
    }

    const candidateId = nearest?.pin.id ?? null;

    if (candidateId === focusedPinId) {
      pendingRef.current = null;
      return;
    }

    if (candidateId && focusedPinId) {
      const current = projections.find((p) => p.pin.id === focusedPinId);
      const candidateAngle = Math.abs(nearest!.relativeAngleDeg);
      const currentAngle = current ? Math.abs(current.relativeAngleDeg) : Infinity;
      if (currentAngle - candidateAngle < SWITCH_MARGIN_DEG) {
        pendingRef.current = null;
        return;
      }
    }

    const now = Date.now();
    if (pendingRef.current?.id === candidateId) {
      if (now - pendingRef.current.since >= HOLD_MS) {
        setFocusedPinId(candidateId);
        pendingRef.current = null;
      }
    } else {
      pendingRef.current = { id: candidateId, since: now };
    }
  }, [projections, focusedPinId]);

  return focusedPinId;
}
