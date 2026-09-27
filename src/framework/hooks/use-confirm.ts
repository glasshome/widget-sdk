import { createSignal, onCleanup } from "solid-js";

const CONFIRM_MS = 1600;

export interface Confirm {
  /** Whether this key ran a moment ago. */
  has: (key: string) => boolean;
  /** Whether anything ran a moment ago. */
  any: () => boolean;
  /** Runs the action; resolves whether it succeeded. */
  run: (keys: string[], action: () => unknown) => Promise<boolean>;
}

/**
 * For actions that leave no state to show (a scene, a button press, a stop): the keys that just ran,
 * for a moment. Confirms only after the call succeeds; a failed call is toasted by the host instead.
 */
export function useConfirm(): Confirm {
  const [done, setDone] = createSignal<ReadonlySet<string>>(new Set());
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  return {
    has: (key: string) => done().has(key),
    any: () => done().size > 0,
    run: async (keys, action) => {
      try {
        await action();
      } catch {
        return false;
      }
      setDone(new Set(keys));
      clearTimeout(timer);
      timer = setTimeout(() => setDone(new Set()), CONFIRM_MS);
      return true;
    },
  };
}
