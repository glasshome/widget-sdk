import { createSignal } from "solid-js";

export interface WarmSet<K> {
  has(key: K): boolean;
  touch(key: K): void;
  drop(key: K): void;
}

export function createWarmSet<K>(cap: number): WarmSet<K> {
  const [keys, setKeys] = createSignal<readonly K[]>([]);
  return {
    has: (key) => keys().includes(key),
    touch: (key) => setKeys((held) => [...held.filter((k) => k !== key), key].slice(-cap)),
    drop: (key) => setKeys((held) => (held.includes(key) ? held.filter((k) => k !== key) : held)),
  };
}

export const WARM_SHEET_CAP = 3;

export const warmSheets: WarmSet<object> = createWarmSet<object>(WARM_SHEET_CAP);
