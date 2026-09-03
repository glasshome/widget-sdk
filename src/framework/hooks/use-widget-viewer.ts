import { useContext } from "solid-js";
import { type WidgetViewer, WidgetCtx } from "./use-widget-context";

const NOBODY: WidgetViewer = { name: null };

/** Who is looking. A paired screen belongs to a room, not to a person, so it
 *  reads as nobody and nothing greets it by name. */
export function useWidgetViewer(): () => WidgetViewer {
  const ctx = useContext(WidgetCtx);
  return () => ctx?.viewer?.() ?? NOBODY;
}
