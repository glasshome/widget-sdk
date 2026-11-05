import { createMemoryWidgetState, type WidgetStateVerdict } from "@glasshome/widget-contract/state";
import { type Accessor, createMemo, createSignal, type Signal, untrack } from "solid-js";
import type { z } from "zod";
import {
  type ReactiveWidgetContext,
  useWidgetContext,
  type WidgetStateStore,
} from "./use-widget-context";

function toJson(value: unknown): string | null | undefined {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function parseJson(text: string | undefined): unknown {
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function createMemoryStore(): WidgetStateStore {
  const memory = createMemoryWidgetState();
  const signals = new Map<string, Signal<string | undefined>>();
  const signalFor = (key: string) => {
    let signal = signals.get(key);
    if (!signal) {
      signal = createSignal<string | undefined>(memory.snapshot()[key]);
      signals.set(key, signal);
    }
    return signal;
  };
  return {
    read: (key) => parseJson(signalFor(key)[0]()),
    write(key, value) {
      const json = toJson(value);
      if (json === undefined) return "value";
      const verdict = memory.write(key, json);
      if (verdict === "ok") signalFor(key)[1](json ?? undefined);
      return verdict;
    },
  };
}

const memoryStores = new WeakMap<ReactiveWidgetContext, WidgetStateStore>();

function storeFor(ctx: ReactiveWidgetContext): WidgetStateStore {
  if (ctx.state) return ctx.state;
  let store = memoryStores.get(ctx);
  if (!store) {
    store = createMemoryStore();
    memoryStores.set(ctx, store);
  }
  return store;
}

/**
 * A small value this widget keeps across reloads, for this widget on this board and this person.
 * The stored value is read through `schema`; anything it refuses reads as `fallback`.
 * The setter returns the host's verdict: anything but "ok" changed nothing.
 */
export function useWidgetState<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): [Accessor<T>, (next: T | ((prev: T) => T)) => WidgetStateVerdict] {
  const store = storeFor(useWidgetContext());
  const value = createMemo(() => {
    const parsed = schema.safeParse(store.read(key));
    return parsed.success ? parsed.data : fallback;
  });
  const set = (next: T | ((prev: T) => T)): WidgetStateVerdict => {
    const resolved = typeof next === "function" ? (next as (prev: T) => T)(untrack(value)) : next;
    return store.write(key, resolved);
  };
  return [value, set];
}
