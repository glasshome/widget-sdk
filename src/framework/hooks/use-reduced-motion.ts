import { type Accessor, createSignal, onCleanup } from "solid-js";

/**
 * Reactive `prefers-reduced-motion` accessor.
 *
 * SSR-safe: returns a constant `false` when `window`/`matchMedia` are absent.
 */
export function useReducedMotion(): Accessor<boolean> {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => false;
  }

  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const [reduced, setReduced] = createSignal(query.matches);

  const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
  query.addEventListener("change", onChange);
  onCleanup(() => query.removeEventListener("change", onChange));

  return reduced;
}
