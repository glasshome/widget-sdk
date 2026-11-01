import { type Accessor, createSignal, onCleanup } from "solid-js";
import { htmlHasClass } from "../../theme";

/**
 * Reactive reduced-motion accessor: true when the device asks for reduced motion or the home's
 * Reduce motion setting is on (the `reduce-motion` class on <html>).
 *
 * SSR-safe: returns a constant `false` when `window`/`matchMedia` are absent.
 */
export function useReducedMotion(): Accessor<boolean> {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => false;
  }

  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const [device, setDevice] = createSignal(query.matches);

  const onChange = (event: MediaQueryListEvent) => setDevice(event.matches);
  query.addEventListener("change", onChange);
  onCleanup(() => query.removeEventListener("change", onChange));

  return () => device() || htmlHasClass("reduce-motion");
}
