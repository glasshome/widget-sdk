/**
 * Widget Gestures Hook
 *
 * Provides gesture handling for widgets with automatic conflict resolution.
 * Ported from React reference, adapted for SolidJS:
 * - Uses mutable state object instead of useRef (imperative gesture tracking)
 * - Accepts config/orientation as accessors for reactivity
 * - Returns native PointerEvent handlers (not React.PointerEvent)
 * - Callers bind via on:pointerdown={handlers.onPointerDown}
 *
 * @example
 * ```tsx
 * const gestures = useWidgetGestures(
 *   () => ({
 *     tap: handleTap,
 *     hold: { action: handleHold, delay: 300 },
 *     slide: {
 *       value: brightness(),
 *       onChange: setBrightness,
 *       min: 0,
 *       max: 100,
 *       orientation: "auto",
 *     },
 *   }),
 *   () => ctx.orientation(),
 * );
 *
 * return <div on:pointerdown={gestures.onPointerDown} on:pointermove={gestures.onPointerMove} on:pointerup={gestures.onPointerUp} on:pointercancel={gestures.onPointerCancel}>...</div>;
 * ```
 */

import type { GestureConfig, WidgetOrientation } from "../types";
import { cursors } from "./cursors";

export interface GestureHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onPointerCancel: (e: PointerEvent) => void;
  /** Sets the correct cursor on the element. Bind via on:pointerenter. */
  onPointerEnter: (e: PointerEvent) => void;
  /** Cancel any pending hold/slide timers. Call on component unmount via onCleanup. */
  dispose: () => void;
}

interface GestureState {
  isDown: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  hasMoved: boolean;
  holdTimer: ReturnType<typeof setTimeout> | null;
  slideActive: boolean;
  slideActivationTimer: ReturnType<typeof setTimeout> | null;
  lockedAxis: "horizontal" | "vertical" | null;
  element: HTMLElement | null;
}

/**
 * Widget gestures hook with conflict resolution
 *
 * Features:
 * - Axis locking: Once slide direction is detected, locks to that axis
 * - Scroll prevention: Blocks page scroll when sliding along widget axis
 * - Tap/hold/slide gesture support with automatic conflict resolution
 *
 * @param config - Accessor returning gesture configuration
 * @param orientation - Accessor returning widget orientation (for auto slide orientation)
 */
export function useWidgetGestures(
  config: () => GestureConfig,
  orientation?: () => WidgetOrientation,
): GestureHandlers {
  // Mutable state -- gesture tracking is imperative, not reactive
  const state: GestureState = {
    isDown: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    hasMoved: false,
    holdTimer: null,
    slideActive: false,
    slideActivationTimer: null,
    lockedAxis: null,
    element: null,
  };

  // Cached element dimensions — avoids forced layout recalculation in hot paths
  let cachedRect: { width: number; height: number } | null = null;
  let observedElement: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function observeElement(el: HTMLElement): void {
    if (el === observedElement) return;
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Use borderBoxSize when available (avoids layout), fall back to contentRect
        const box = entry.borderBoxSize?.[0];
        if (box) {
          cachedRect = { width: box.inlineSize, height: box.blockSize };
        } else {
          cachedRect = { width: entry.contentRect.width, height: entry.contentRect.height };
        }
      }
    });
    observedElement = el;
    resizeObserver.observe(el);
    // Seed the cache synchronously from clientWidth/clientHeight (no layout forced if recent)
    cachedRect = { width: el.clientWidth, height: el.clientHeight };
  }

  // Constants
  const TAP_THRESHOLD = 10; // pixels
  const AXIS_LOCK_THRESHOLD = 5; // pixels before axis is determined

  const clearTimers = () => {
    if (state.holdTimer) {
      clearTimeout(state.holdTimer);
      state.holdTimer = null;
    }
    if (state.slideActivationTimer) {
      clearTimeout(state.slideActivationTimer);
      state.slideActivationTimer = null;
    }
  };

  // Resolve slide orientation from config, context, or element dimensions
  const getSlideOrientation = (el?: HTMLElement): "horizontal" | "vertical" => {
    const cfg = config();
    const slide = cfg.slide;
    if (slide?.orientation === "horizontal") return "horizontal";
    if (slide?.orientation === "vertical") return "vertical";
    // "auto" — prefer element dimensions (avoids stale context from parent providers)
    if (el) {
      // Use cached dimensions — no layout thrash during pointer moves
      if (!cachedRect) observeElement(el);
      if (cachedRect) {
        return cachedRect.height > cachedRect.width ? "vertical" : "horizontal";
      }
    }
    const orient = orientation?.() ?? "horizontal";
    return orient === "horizontal" ? "horizontal" : "vertical";
  };

  const onPointerDown = (e: PointerEvent) => {
    const cfg = config();

    // If no gestures configured, do nothing
    if (!cfg.tap && !cfg.hold && !cfg.slide) return;

    e.preventDefault();
    state.isDown = true;
    state.element = e.currentTarget as HTMLElement;
    observeElement(state.element);
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.currentX = e.clientX;
    state.currentY = e.clientY;
    state.startTime = Date.now();
    state.hasMoved = false;
    state.slideActive = false;
    state.lockedAxis = null;

    // Capture pointer
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // Start hold timer if hold gesture is configured
    if (cfg.hold) {
      const holdDelay = cfg.hold.delay ?? 300;
      state.holdTimer = setTimeout(() => {
        if (state.isDown && !state.hasMoved) {
          cfg.hold!.action();
          state.isDown = false; // Prevent tap after hold
        }
      }, holdDelay);
    }

    // Start slide activation timer if slide is configured
    if (cfg.slide) {
      const slideActivationDelay = cfg.slide.activationDelay ?? 0;
      if (slideActivationDelay > 0) {
        state.slideActivationTimer = setTimeout(() => {
          state.slideActive = true;
        }, slideActivationDelay);
      } else {
        state.slideActive = true;
      }
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!state.isDown) return;

    const cfg = config();
    state.currentX = e.clientX;
    state.currentY = e.clientY;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const el = e.currentTarget as HTMLElement;
    const slideOrientation = getSlideOrientation(el);

    // Axis lock detection
    // Once movement exceeds threshold, determine dominant axis and lock to it
    if (!state.lockedAxis && distance > AXIS_LOCK_THRESHOLD) {
      if (absDeltaX > absDeltaY) {
        state.lockedAxis = "horizontal";
      } else {
        state.lockedAxis = "vertical";
      }

      // If locked axis doesn't match slide orientation, release and allow scroll
      if (cfg.slide && state.lockedAxis !== slideOrientation) {
        el.releasePointerCapture(e.pointerId);
        state.isDown = false;
        state.slideActive = false;
        clearTimers();
        return;
      }
    }

    // Check if pointer has moved beyond threshold
    if (distance > TAP_THRESHOLD) {
      state.hasMoved = true;
      clearTimers(); // Cancel hold if we've moved
    }

    // Handle slide gesture (only if axis is locked to slide direction)
    if (cfg.slide && state.slideActive && state.hasMoved && state.lockedAxis === slideOrientation) {
      const min = cfg.slide.min ?? 0;
      const max = cfg.slide.max ?? 100;
      const range = max - min;

      // Calculate delta based on orientation (use only the locked axis)
      const delta =
        slideOrientation === "vertical"
          ? -deltaY // Negative because Y increases downward
          : deltaX;

      // Get container width/height for percentage calculation
      const containerSize =
        slideOrientation === "vertical"
          ? (e.currentTarget as HTMLElement).clientHeight
          : (e.currentTarget as HTMLElement).clientWidth;

      // Calculate new value
      const percentChange = delta / containerSize;
      const valueChange = percentChange * range;
      const newValue = Math.max(min, Math.min(max, cfg.slide.value + valueChange));

      // Call onChange
      cfg.slide.onChange(Math.round(newValue));

      // Update start position for continuous sliding
      state.startX = state.currentX;
      state.startY = state.currentY;

      // Prevent default to stop scrolling during slide
      e.preventDefault();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!state.isDown) return;

    const cfg = config();
    const holdDelay = cfg.hold?.delay ?? 300;

    clearTimers();

    // Check for tap
    if (cfg.tap && !state.hasMoved) {
      const duration = Date.now() - state.startTime;
      // Only trigger tap if not a hold (hold would have cleared isDown)
      if (state.isDown && duration < holdDelay) {
        cfg.tap();
      }
    }

    // Reset state
    state.isDown = false;
    state.hasMoved = false;
    state.slideActive = false;
    state.lockedAxis = null;

    // Release pointer
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onPointerCancel = (e: PointerEvent) => {
    clearTimers();

    state.isDown = false;
    state.hasMoved = false;
    state.slideActive = false;
    state.lockedAxis = null;

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const getCursorForElement = (el: HTMLElement): string => {
    const cfg = config();
    if (cfg.slide) {
      const orient = cfg.slide.orientation;
      if (orient === "horizontal") return cursors.slideHorizontal.css;
      if (orient === "vertical") return cursors.slideVertical.css;
      // "auto" — use cached dimensions, no layout thrash on pointer enter
      if (!cachedRect) observeElement(el);
      if (cachedRect) {
        return cachedRect.height > cachedRect.width ? cursors.slideVertical.css : cursors.slideHorizontal.css;
      }
      return cursors.slideHorizontal.css; // fallback before first observation
    }
    if (cfg.tap) return cursors.tap.css;
    if (cfg.hold) return cursors.hold.css;
    return "";
  };

  const onPointerEnter = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    state.element = el;
    el.style.cursor = getCursorForElement(el);
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerEnter,
    dispose: () => {
      clearTimers();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      observedElement = null;
      cachedRect = null;
    },
  };
}
