import { createSignal, type Signal } from "solid-js";

const watched = new Map<string, Signal<boolean>>();
let watcher: MutationObserver | undefined;

function watch(root: HTMLElement): MutationObserver {
  const observer = new MutationObserver(() => {
    for (const [name, [, set]] of watched) set(root.classList.contains(name));
  });
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  return observer;
}

/** Whether `<html>` carries `name`, read live: a memo or effect that calls it runs again when it flips. */
export function htmlHasClass(name: string): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  let signal = watched.get(name);
  if (!signal) {
    signal = createSignal(root.classList.contains(name));
    watched.set(name, signal);
    watcher ??= watch(root);
  }
  signal[0]();
  // The observer reports a flip a microtask late; the class itself is never stale.
  return root.classList.contains(name);
}

/**
 * Whether the home is in dark mode: the "dark" class on <html>. Reactive inside a memo or effect,
 * in every engine.
 */
export function isDark(): boolean {
  return htmlHasClass("dark");
}
