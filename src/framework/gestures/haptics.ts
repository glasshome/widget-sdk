/**
 * Haptic feedback for gesture transitions.
 *
 * Resolution order at runtime:
 *   1. Capacitor Haptics plugin (Android/iOS native) — richer patterns
 *   2. `navigator.vibrate` (Android Chrome/WebView)
 *   3. silent (desktop, iOS Safari)
 *
 * No build-time dependency on @capacitor/haptics — the host app installs the
 * plugin; we probe `window.Capacitor.Plugins.Haptics` at call time.
 */

type CapacitorHaptics = {
  impact: (opts: { style: "Light" | "Medium" | "Heavy" }) => Promise<void>;
  notification?: (opts: { type: "SUCCESS" | "WARNING" | "ERROR" }) => Promise<void>;
};

function getCapacitorHaptics(): CapacitorHaptics | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { Haptics?: CapacitorHaptics } };
  };
  if (!w.Capacitor?.isNativePlatform?.()) return null;
  return w.Capacitor.Plugins?.Haptics ?? null;
}

function webVibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // some browsers reject non-user-initiated vibrate; safe to ignore
  }
}

export const haptics = {
  /** Light confirmation — fires when slide gesture arms after user holds still. */
  tick(): void {
    const cap = getCapacitorHaptics();
    if (cap) {
      cap.impact({ style: "Light" }).catch(() => {});
      return;
    }
    webVibrate(8);
  },

  /** Medium bump — fires when hold gesture commits (detail opening). */
  bump(): void {
    const cap = getCapacitorHaptics();
    if (cap) {
      cap.impact({ style: "Medium" }).catch(() => {});
      return;
    }
    webVibrate(20);
  },

  /** Stronger pulse — reserved for edit-mode pickup (future use). */
  pulse(): void {
    const cap = getCapacitorHaptics();
    if (cap) {
      cap.impact({ style: "Heavy" }).catch(() => {});
      return;
    }
    webVibrate([0, 15, 40, 15]);
  },
};
