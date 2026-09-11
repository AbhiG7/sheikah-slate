interface PermissionGatedEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

export interface WebSensorSupport {
  /** The browser dispatches devicemotion at all. */
  hasMotionEvent: boolean;
  hasOrientationEvent: boolean;
  /** iOS 13+ gates the events behind an explicit, gesture-driven request. */
  needsPermission: boolean;
}

export type WebSensorPermissionResult =
  | "granted"
  | "denied"
  | "not-required"
  | "unavailable"
  | "error";

let alreadyArmed = false;

function gatedEvents() {
  const scope = globalThis as unknown as {
    DeviceOrientationEvent?: PermissionGatedEvent;
    DeviceMotionEvent?: PermissionGatedEvent;
  };
  return { orientation: scope.DeviceOrientationEvent, motion: scope.DeviceMotionEvent };
}

export function describeWebSensorSupport(): WebSensorSupport {
  if (typeof window === "undefined") {
    return { hasMotionEvent: false, hasOrientationEvent: false, needsPermission: false };
  }

  const { orientation, motion } = gatedEvents();
  return {
    hasMotionEvent: Boolean(motion),
    hasOrientationEvent: Boolean(orientation),
    needsPermission: Boolean(orientation?.requestPermission || motion?.requestPermission),
  };
}

/**
 * Asks for motion and orientation access directly.
 *
 * Must be called from inside a real user gesture handler, which is why the
 * diagnostics screen drives this from a button press rather than relying on
 * the opportunistic listener below. A button is also retryable: the listener
 * fires once and cannot be re-armed without a page reload, so a dismissed or
 * denied prompt would otherwise be unrecoverable.
 */
export async function requestWebSensorPermission(): Promise<WebSensorPermissionResult> {
  if (typeof window === "undefined") return "unavailable";

  const { orientation, motion } = gatedEvents();
  if (!orientation && !motion) return "unavailable";
  if (!orientation?.requestPermission && !motion?.requestPermission) {
    return "not-required";
  }

  try {
    // Orientation first and awaited separately: iOS is unreliable about
    // honouring two permission requests fired together in one gesture.
    const orientationResult = await orientation?.requestPermission?.();
    const motionResult = await motion?.requestPermission?.();

    const results = [orientationResult, motionResult].filter(Boolean);
    return results.every((r) => r === "granted") ? "granted" : "denied";
  } catch {
    return "error";
  }
}

/**
 * Opportunistic fallback: asks on the first tap anywhere, so the viewfinder
 * starts tracking without the user having to visit diagnostics first.
 */
export function armWebSensorPermission(): void {
  if (alreadyArmed || typeof window === "undefined") return;
  if (!describeWebSensorSupport().needsPermission) return;

  alreadyArmed = true;

  const request = () => {
    requestWebSensorPermission().catch(() => {});
    window.removeEventListener("touchend", request);
    window.removeEventListener("click", request);
  };

  window.addEventListener("touchend", request);
  window.addEventListener("click", request);
}
