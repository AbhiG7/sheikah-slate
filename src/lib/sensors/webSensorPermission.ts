interface PermissionGatedEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

let alreadyArmed = false;

/**
 * iOS 13+ hides DeviceOrientationEvent and DeviceMotionEvent behind a
 * permission call that must originate from a real user gesture, so it
 * cannot simply be requested on mount. This arms a one-shot listener that
 * asks on the first tap or click.
 *
 * A no-op everywhere the gate does not exist, which includes desktop
 * browsers and Android.
 */
export function armWebSensorPermission(): void {
  if (alreadyArmed || typeof window === "undefined") return;

  const orientation = (
    globalThis as unknown as { DeviceOrientationEvent?: PermissionGatedEvent }
  ).DeviceOrientationEvent;
  const motion = (
    globalThis as unknown as { DeviceMotionEvent?: PermissionGatedEvent }
  ).DeviceMotionEvent;

  if (!orientation?.requestPermission && !motion?.requestPermission) return;

  alreadyArmed = true;

  const request = () => {
    orientation?.requestPermission?.().catch(() => {});
    motion?.requestPermission?.().catch(() => {});
    window.removeEventListener("touchend", request);
    window.removeEventListener("click", request);
  };

  window.addEventListener("touchend", request);
  window.addEventListener("click", request);
}
