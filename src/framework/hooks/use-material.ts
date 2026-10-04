import { FROSTED, materialTerms } from "@glasshome/ui/tokens";
import { useContext } from "solid-js";
import { type WidgetMaterial, WidgetCtx } from "./use-widget-context";

const PLAIN_GLASS: WidgetMaterial = { id: FROSTED.preset, terms: materialTerms(FROSTED) };

/** The material the home is wearing, by id with its terms. Style from the
 *  public --material-* variables; read this to decide, never to paint. */
export function useMaterial(): () => WidgetMaterial {
  const ctx = useContext(WidgetCtx);
  return () => ctx?.material?.() ?? PLAIN_GLASS;
}
