import {
  useService as useDirectService,
  useToggle as useDirectToggle,
  useTurnOff as useDirectTurnOff,
  useTurnOn as useDirectTurnOn,
} from "@glasshome/sync-layer/solid";
import { useContext } from "solid-js";
import { type ServiceCallFn, WidgetCtx } from "./use-widget-context";

/**
 * Service hooks for widget code. Inside a host-mounted widget the context
 * carries a capability-routed callService (an RPC into the HA bridge worker,
 * validated against the widget's granted capabilities); these hooks route
 * through it. Outside a host (preview, tests) they fall back to the direct
 * sync-layer commands.
 */

function entityDomain(entityId: string | string[]): string {
  const first = Array.isArray(entityId) ? entityId[0] : entityId;
  const domain = first?.split(".")[0];
  if (!domain) throw new Error(`Invalid entity ID: ${String(first)}`);
  return domain;
}

function shortcut(call: ServiceCallFn, service: "turn_on" | "turn_off" | "toggle") {
  return (entityId: string | string[], serviceData: Record<string, unknown> = {}) =>
    call(entityDomain(entityId), service, serviceData, { entity_id: entityId });
}

export function useService(): {
  callService: ServiceCallFn;
  turnOn: ReturnType<typeof useDirectTurnOn>;
  turnOff: ReturnType<typeof useDirectTurnOff>;
  toggle: ReturnType<typeof useDirectToggle>;
} {
  const routed = useContext(WidgetCtx)?.callService;
  if (!routed) return useDirectService() as ReturnType<typeof useService>;
  return {
    callService: routed,
    turnOn: shortcut(routed, "turn_on"),
    turnOff: shortcut(routed, "turn_off"),
    toggle: shortcut(routed, "toggle"),
  };
}

export function useTurnOn(): ReturnType<typeof useDirectTurnOn> {
  const routed = useContext(WidgetCtx)?.callService;
  return routed ? shortcut(routed, "turn_on") : useDirectTurnOn();
}

export function useTurnOff(): ReturnType<typeof useDirectTurnOff> {
  const routed = useContext(WidgetCtx)?.callService;
  return routed ? shortcut(routed, "turn_off") : useDirectTurnOff();
}

export function useToggle(): ReturnType<typeof useDirectToggle> {
  const routed = useContext(WidgetCtx)?.callService;
  return routed ? shortcut(routed, "toggle") : useDirectToggle();
}
