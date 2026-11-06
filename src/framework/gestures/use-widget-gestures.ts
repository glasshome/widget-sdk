/**
 * Widget Gestures Hook — tap, hold, and slide on every pointer type.
 *
 * Touch slide vs page scroll is split per axis: `touch-action` cedes the
 * cross axis to the browser, and a press only commits to sliding when
 * movement is dominantly on the slide axis.
 */

import { createHold } from "@glasshome/ui/solid";
import { createSignal, useContext } from "solid-js";
import { WidgetCtx } from "../hooks/use-widget-context";
import { dialogOpeners } from "../hooks/use-widget-dialog";
import { widgetRegistry } from "../hooks/widget-registry";
import type { GestureConfig } from "../types";

type GestureOrientation = "horizontal" | "vertical" | "square";
import { cursors } from "./cursors";
import { haptics } from "./haptics";

/** A press that starts on a control inside a widget belongs to that control. */
export const INTERACTIVE =
  'button, a, input, select, textarea, [role="slider"], [role="radio"], [role="switch"]';

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
  /** Where a hold is filling from, relative to the element; `fired` once it opened. */
  hold?: () => HoldFlood | null;
  /** True while a hold opens something; the "nothing more here" answer does not count. */
  holds?: () => boolean;
  /** Keyboard door: Enter or Space taps, the context-menu key or Shift+F10 holds. */
  onKeyDown?: (e: KeyboardEvent) => void;
}

interface HoldFlood {
  x: number;
  y: number;
  /** Radius that reaches the farthest corner, so the fill ends as the hold fires. */
  r: number;
  fired: boolean;
}

interface GestureState {
  isDown: boolean;
  isTouch: boolean;
  startX: number;
  startY: number;
  hasMoved: boolean;
  /** True for mouse/pen once user starts dragging — drives slide path. */
  sliding: boolean;
  /** Pressed on a control: the control keeps taps and drags, the widget only holds. */
  holdOnly: boolean;
  element: HTMLElement | null;
  /** The slide value when the press began, restored if a second finger takes the press away. */
  startValue: number | undefined;
}

export function useWidgetGestures(
  wired: () => GestureConfig,
  orientation?: () => GestureOrientation,
): GestureHandlers {
  // Every widget answers a hold: its own, else its sheet, else "nothing more here".
  const ctx = useContext(WidgetCtx);
  const registry = widgetRegistry(ctx);
  const config = (): GestureConfig => {
    const c = wired();
    if (c.hold || !ctx) return c;
    return {
      ...c,
      hold: {
        action: () =>
          registry?.hasSheet() ? dialogOpeners.get(ctx)?.() : registry?.setNothingMore(true),
      },
    };
  };
  const TAP_THRESHOLD = 10; // px — movement above this means not-a-tap

  const state: GestureState = {
    isDown: false,
    isTouch: false,
    startX: 0,
    startY: 0,
    hasMoved: false,
    sliding: false,
    holdOnly: false,
    element: null,
    startValue: undefined,
  };
  const [hold, setHold] = createSignal<HoldFlood | null>(null);

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

  const press = createHold({
    // Read at each press, so a config that changes its delay is honoured.
    get delayMs() {
      return config().hold?.delay;
    },
    slopPx: TAP_THRESHOLD,
    onArm: (at) => {
      const el = state.element;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const x = at.x - box.left;
      const y = at.y - box.top;
      const r = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));
      setHold({ x, y, r, fired: false });
    },
    onDisarm: () => setHold(null),
    onHold: () => {
      setHold((h) => (h ? { ...h, fired: true } : h));
      haptics.bump();
      config().hold?.action();
      ctx?.onHeld?.();
      state.isDown = false; // prevent tap on release
    },
  });

  const resetState = () => {
    state.isDown = false;
    state.hasMoved = false;
    state.sliding = false;
    state.holdOnly = false;
    state.startValue = undefined;
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
    if (e.pointerType === "touch" && !e.isPrimary) return;
    const cfg = config();
    const own =
      e.target instanceof Element
        ? e.target.closest(`${INTERACTIVE}, .glasshome-widget-controls`)
        : null;
    const holdOnly = own !== null && own !== e.currentTarget;
    if (holdOnly ? !cfg.hold : !cfg.tap && !cfg.hold && !cfg.slide) return;

    state.isDown = true;
    state.holdOnly = holdOnly;
    state.isTouch = e.pointerType === "touch";
    state.element = e.currentTarget as HTMLElement;
    observeElement(state.element);
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.hasMoved = false;
    state.sliding = false;
    state.startValue = cfg.slide?.value;

    if (cfg.hold) press.down(e);

    // Touch pointers are implicitly captured; mouse/pen needs it explicit.
    if (!state.isTouch && cfg.slide && !holdOnly) {
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
      press.up();
      state.hasMoved = true;
    }

    if (cfg.slide && state.hasMoved && !state.holdOnly) {
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
    press.up();

    // Tap: still down (hold didn't fire), no real movement. Same rule on touch and mouse.
    if (wasDown && cfg.tap && !state.hasMoved && !state.holdOnly) {
      cfg.tap();
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // never captured on touch path — fine
    }
    resetState();
  };

  // The browser or the page took the press (a scroll, a second finger), so the slide never happened.
  const onPointerCancel = (e: PointerEvent) => {
    press.up();
    const slide = config().slide;
    if (state.sliding && slide && state.startValue !== undefined) slide.onChange(state.startValue);
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

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const cfg = config();
    if ((e.key === "Enter" || e.key === " ") && cfg.tap) {
      e.preventDefault();
      cfg.tap();
    } else if ((e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) && cfg.hold) {
      e.preventDefault();
      cfg.hold.action();
      ctx?.onHeld?.();
    }
  };

  return {
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerEnter,
    bindElement,
    touchAction,
    hold,
    holds: () => !!wired().hold || !!registry?.hasSheet(),
    dispose: () => {
      press.cancel();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      observedElement = null;
      cachedRect = null;
    },
  };
}
