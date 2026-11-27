import { action, createOptimistic, createSignal, flush, until } from "solid-js";

export const ENTITY_COMMAND_TIMEOUT_MS = 5_000;

export interface EntityCommandOptions<T> {
  /** What the entity reports now. Omit for a command with no value to show (a scene, a button). */
  reported?: () => T;
  /** Sends the command. Resolves when Home Assistant accepted it. */
  send: (value: T) => Promise<unknown> | void;
  /** Whether the report has reached what was sent. Defaults to equality, or always when nothing is reported. */
  arrived?: (reported: T, target: T) => boolean;
  /** How long to wait for the report before the shown value reverts. */
  timeoutMs?: number;
  /** Receives a failed send or a timeout. Defaults to the console. */
  onError?: (error: unknown) => void;
}

export interface EntityCommand<T> {
  /** The value to draw: a held drag, else the sent value until the entity reports it, else the entity's. */
  value: () => T;
  /** True from the send until the entity reports the value, the send fails or the wait times out. */
  busy: () => boolean;
  /** True from the first `hold` until `run`. */
  dragging: () => boolean;
  /** Shows a value while a finger is still moving; nothing is sent. */
  hold: (value: T) => void;
  /** Sends the value and keeps it shown until the entity reports it. Resolves true when it reported, false when the send failed or timed out (the shown value is back to the entity's). */
  run: (value: T) => Promise<boolean>;
}

const same = <T>(reported: T, target: T) => Object.is(reported, target);
const always = () => true;

/**
 * One command from a control to an entity: the sent value shows at once and stays until the
 * entity reports it. A failed send or a report that never comes puts the entity's value back.
 */
export function useEntityCommand<T = void>(options: EntityCommandOptions<T>): EntityCommand<T> {
  const read = () => options.reported?.() as T;
  const [sent, setSent] = createOptimistic<T>(read);
  const [busy, setBusy] = createOptimistic(false);
  const [held, setHeld] = createSignal<{ value: T } | undefined>();
  const [dragging, setDragging] = createSignal(false);
  let holds = 0;

  const command = action(function* (value: T) {
    setSent(() => value);
    setBusy(true);
    yield options.send(value);
    const arrived = options.arrived ?? (options.reported ? same : always);
    yield until(() => arrived(read(), value), {
      timeout: options.timeoutMs ?? ENTITY_COMMAND_TIMEOUT_MS,
    });
  });

  return {
    value: () => {
      const pending = held();
      return pending ? pending.value : sent();
    },
    busy,
    dragging,
    hold: (value) => {
      holds++;
      setHeld({ value });
      setDragging(true);
    },
    run: async (value) => {
      // An action holds the writes its caller made in the same tick, so the drag ends before it starts.
      setDragging(false);
      flush();
      const mine = holds;
      try {
        await command(value);
        return true;
      } catch (error) {
        (options.onError ?? console.error)(error);
        return false;
      } finally {
        if (mine === holds) setHeld(undefined);
      }
    },
  };
}
