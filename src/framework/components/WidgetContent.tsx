import { children, createEffect, createMemo, type JSX, onCleanup, useContext } from "solid-js";
import { WidgetCtx } from "../hooks/use-widget-context";
import { widgetRegistry } from "../hooks/widget-registry";
import { cn } from "../utils/cn";

const PART = /\bglasshome-widget-(head|hero|controls|backdrop|glyph|layer)\b/;

interface WidgetContentProps {
  /** Colour for this content and the widget's sheet, over the shell's `tone`/`color`. */
  accent?: string;
  class?: string;
  children: JSX.Element;
}

/**
 * The widget's layout. With anatomy parts inside (`Widget.Head`, `Widget.Hero`, `Widget.Controls`,
 * `Widget.Backdrop`, `Widget.Layer`, `Widget.Glyph`) it lays them out as a tile; with none it is the original column.
 */
export function WidgetContent(props: WidgetContentProps): JSX.Element {
  const registry = widgetRegistry(useContext(WidgetCtx));
  createEffect(() => registry?.setAccent(props.accent));
  onCleanup(() => registry?.setAccent(undefined));
  const resolved = children(() => props.children);
  const hasParts = createMemo(() =>
    resolved.toArray().some((n) => n instanceof Element && PART.test(n.className)),
  );
  return (
    <div
      class={cn(hasParts() ? "glasshome-widget-grid" : "glasshome-widget-content", props.class)}
      style={props.accent ? { "--widget-color": props.accent } : undefined}
    >
      {resolved()}
    </div>
  );
}
