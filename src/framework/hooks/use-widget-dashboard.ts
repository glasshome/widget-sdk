import { useContext } from "solid-js";
import { type WidgetDashboard, WidgetCtx } from "./use-widget-context";

const EMPTY: WidgetDashboard = { name: "", icon: "", areaId: null };

export function useWidgetDashboard(): () => WidgetDashboard {
  const ctx = useContext(WidgetCtx);
  return () => ctx?.dashboard?.() ?? EMPTY;
}
