import { createSignal } from "solid-js";

export interface WarmSet<K> {
  has(key: K): boolean;
  touch(key: K): void;
  drop(key: K): void;
}

export function createWarmSet<K>(cap: number): WarmSet<K> {
  // Reads lag writes until flush; the plain list answers a has() right after a touch.
  let held: readonly K[] = [];
  const [version, setVersion] = createSignal(0);
  const hold = (next: readonly K[]) => {
    if (next === held) return;
    held = next;
    setVersion((v) => v + 1);
  };
  return {
    has: (key) => {
      version();
      return held.includes(key);
    },
    touch: (key) => hold([...held.filter((k) => k !== key), key].slice(-cap)),
    drop: (key) => hold(held.includes(key) ? held.filter((k) => k !== key) : held),
  };
}

export const WARM_SHEET_CAP = 3;

export const warmSheets: WarmSet<object> = createWarmSet<object>(WARM_SHEET_CAP);
