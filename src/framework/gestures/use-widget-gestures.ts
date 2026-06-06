/**
 * Widget Gestures Hook — tap, hold, and slide on every pointer type.
 *
 * Touch slide vs page scroll is split per axis: `touch-action` cedes the
 * cross axis to the browser, and a press only commits to sliding when
 * movement is dominantly on the slide axis.
 */

import { createSignal } from "solid-js";
import type { GestureConfig } from "../types";

type GestureOrientation = "horizontal" | "vertical" | "square";
import { cursors } from "./cursors";
import { haptics } from "./haptics";

export interface GestureHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onPointerCancel: (e: PointerEvent) => void;
  /** Sets the correct cursor on the element. Bind via on:pointerenter. */
  onPointerEnter: (e: PointerEvent) => void;
  /**
   * Ref callback. Seeds the size observer used for `orientation: "auto"` slide
   * resolution. Bind via `ref={gestures.bindElement}` on the same element that
   * receives the pointer handlers.
   */
  bindElement: (el: HTMLElement) => void;
  /** CSS `touch-action` for the gesture root. */
  touchAction: () => string;
  /** Cancel any pending hold timer. Call on component unmount via onCleanup. */
  dispose: () => void;
}

interface GestureState {
  isDown: boolean;
  isTouch: boolean;
  startX: number;
  startY: number;
  startTime: number;
  hasMoved: boolean;
  /** True for mouse/pen once user starts dragging — drives slide path. */
  sliding: boolean;
  holdTimer: ReturnType<typeof setTimeout> | null;
  element: HTMLElement | null;
}

export function useWidgetGestures(
  config: () => GestureConfig,
  orientation?: () => GestureOrientation,
): GestureHandlers {
  const HOLD_DELAY = 300; // ms
  const TAP_THRESHOLD = 10; // px — movement above this means not-a-tap

  const state: GestureState = {
    isDown: false,
    isTouch: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    hasMoved: false,
    sliding: false,
    holdTimer: null,
    element: null,
  };

  // Cached element dimensions — avoids forced layout in slide path.
  let cachedRect: { width: number; height: number } | null = null;
  let observedElement: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const [measuredVertical, setMeasuredVertical] = createSignal<boolean | null>(null);

  function observeElement(el: HTMLElement): void {
    if (el === observedElement) return;
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const box = entry.borderBoxSize?.[0];
        if (box) {
          cachedRect = { width: box.inlineSize, height: box.blockSize };
        } else {
          cachedRect = { width: entry.contentRect.width, height: entry.contentRect.height };
        }
        setMeasuredVertical(cachedRect.height > cachedRect.width);
      }
    });
    observedElement = el;
    resizeObserver.observe(el);
    cachedRect = { width: el.clientWidth, height: el.clientHeight };
    setMeasuredVertical(cachedRect.height > cachedRect.width);
  }

  const clearHold = () => {
    if (state.holdTimer) {
      clearTimeout(state.holdTimer);
      state.holdTimer = null;
    }
  };

  const resetState = () => {
    state.isDown = false;
    state.hasMoved = false;
    state.sliding = false;
  };

  const getSlideOrientation = (el?: HTMLElement): "horizontal" | "vertical" => {
    const cfg = config();
    const slide = cfg.slide;
    if (slide?.orientation === "horizontal") return "horizontal";
    if (slide?.orientation === "vertical") return "vertical";
    if (el) {
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
    if (!cfg.tap && !cfg.hold && !cfg.slide) return;

    state.isDown = true;
    state.isTouch = e.pointerType === "touch";
    state.element = e.currentTarget as HTMLElement;
    observeElement(state.element);
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startTime = Date.now();
    state.hasMoved = false;
    state.sliding = false;

    // Hold timer — same on touch and mouse. Cancelled by movement.
    if (cfg.hold) {
      const holdDelay = cfg.hold.delay ?? HOLD_DELAY;
      state.holdTimer = setTimeout(() => {
        state.holdTimer = null;
        if (!state.isDown || state.hasMoved) return;
        haptics.bump();
        cfg.hold?.action();
        state.isDown = false; // prevent tap on release
      }, holdDelay);
    }

    // Touch pointers are implicitly captured; mouse/pen needs it explicit.
    if (!state.isTouch && cfg.slide) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!state.isDown) return;

    const cfg = config();
    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > TAP_THRESHOLD) {
      clearHold();
      state.hasMoved = true;
    }

    if (cfg.slide && state.hasMoved) {
      const el = e.currentTarget as HTMLElement;
      const slideOrientation = getSlideOrientation(el);

      // Cross-axis touch swipes belong to the browser (page scroll).
      if (state.isTouch && !state.sliding) {
        const axis = Math.abs(slideOrientation === "vertical" ? deltaY : deltaX);
        const cross = Math.abs(slideOrientation === "vertical" ? deltaX : deltaY);
        if (axis < cross) return;
      }
      state.sliding = true;

      const min = cfg.slide.min ?? 0;
      const max = cfg.slide.max ?? 100;
      const range = max - min;

      const delta = slideOrientation === "vertical" ? -deltaY : deltaX;
      const rect = cachedRect ?? { width: el.clientWidth, height: el.clientHeight };
      const containerSize = slideOrientation === "vertical" ? rect.height : rect.width;

      const percentChange = delta / containerSize;
      const valueChange = percentChange * range;
      const newValue = Math.max(min, Math.min(max, cfg.slide.value + valueChange));

      cfg.slide.onChange(Math.round(newValue));

      // Reset start so subsequent moves are incremental.
      state.startX = e.clientX;
      state.startY = e.clientY;

      e.preventDefault();
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const cfg = config();
    const wasDown = state.isDown;
    const duration = Date.now() - state.startTime;
    const holdDelay = cfg.hold?.delay ?? HOLD_DELAY;

    clearHold();

    // Tap: still down (hold didn't fire), no real movement, released before
    // the hold threshold. Same rule on touch and mouse.
    if (wasDown && cfg.tap && !state.hasMoved && duration < holdDelay) {
      cfg.tap();
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // never captured on touch path — fine
    }
    resetState();
  };

  const onPointerCancel = (e: PointerEvent) => {
    clearHold();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    resetState();
  };

  const getCursorForElement = (el: HTMLElement): string => {
    const cfg = config();
    if (cfg.slide) {
      const orient = cfg.slide.orientation;
      if (orient === "horizontal") return cursors.slideHorizontal.css;
      if (orient === "vertical") return cursors.slideVertical.css;
      if (!cachedRect) observeElement(el);
      if (cachedRect) {
        return cachedRect.height > cachedRect.width
          ? cursors.slideVertical.css
          : cursors.slideHorizontal.css;
      }
      return cursors.slideHorizontal.css;
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

  const bindElement = (el: HTMLElement) => {
    if (!el) return;
    state.element = el;
    observeElement(el);
  };

  const touchAction = (): string => {
    const cfg = config();
    if (cfg.slide) {
      const o = cfg.slide.orientation;
      const vertical =
        o === "vertical" ||
        (o !== "horizontal" &&
          (measuredVertical() ?? (orientation?.() ?? "horizontal") !== "horizontal"));
      return vertical ? "pan-x" : "pan-y";
    }
    if (cfg.tap || cfg.hold) return "manipulation";
    return "auto";
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerEnter,
    bindElement,
    touchAction,
    dispose: () => {
      clearHold();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      observedElement = null;
      cachedRect = null;
    },
  };
}
