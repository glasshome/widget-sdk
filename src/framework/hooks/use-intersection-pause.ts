import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

/**
 * True while `el` is outside the viewport, so callers can pause animation.
 *
 * SSR-safe: returns a constant `false` when `IntersectionObserver` is absent.
 */
export function useIntersectionPause(el: Accessor<Element | undefined>): Accessor<boolean> {
  if (typeof IntersectionObserver === "undefined") {
    return () => false;
  }

  const [paused, setPaused] = createSignal(false);

  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry) setPaused(!entry.isIntersecting);
  });

  createEffect(() => {
    const element = el();
    observer.disconnect();
    if (element) observer.observe(element);
  });

  onCleanup(() => observer.disconnect());

  return paused;
}
