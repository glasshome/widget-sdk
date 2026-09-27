import { type Accessor, createSignal, type Setter } from "solid-js";

/** What a widget's parts tell each other: whether its dialog has a sheet, and the look the sheet wears. */
export interface WidgetRegistry {
  hasSheet: Accessor<boolean>;
  setHasSheet: Setter<boolean>;
  /** The shell's colour (`tone` / `color` on `<Widget>`). */
  tone: Accessor<string | undefined>;
  setTone: Setter<string | undefined>;
  /** A `Widget.Content` accent, which wins over the shell's colour. */
  accent: Accessor<string | undefined>;
  setAccent: Setter<string | undefined>;
  /** The head's icon. */
  icon: Accessor<string | undefined>;
  setIcon: Setter<string | undefined>;
}

const registries = new WeakMap<object, WidgetRegistry>();

/** `<Widget>` hands its parts a copy of the host context; this points the copy back at the original. */
export const REGISTRY_KEY = Symbol("glasshome.widget.registry");

function keyOf(ctx: object): object {
  return (ctx as { [REGISTRY_KEY]?: object })[REGISTRY_KEY] ?? ctx;
}

/** The registry for a widget, keyed by its host context; created on first use. */
export function widgetRegistry(ctx: object | undefined): WidgetRegistry | undefined {
  if (!ctx) return undefined;
  const key = keyOf(ctx);
  let registry = registries.get(key);
  if (!registry) {
    const [hasSheet, setHasSheet] = createSignal(false);
    const [tone, setTone] = createSignal<string>();
    const [accent, setAccent] = createSignal<string>();
    const [icon, setIcon] = createSignal<string>();
    registry = {
      hasSheet,
      setHasSheet,
      tone,
      setTone,
      accent,
      setAccent,
      icon,
      setIcon,
    };
    registries.set(key, registry);
  }
  return registry;
}
