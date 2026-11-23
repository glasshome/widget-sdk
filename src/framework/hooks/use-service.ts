import {
  useService as useDirectService,
  useToggle as useDirectToggle,
  useTurnOff as useDirectTurnOff,
  useTurnOn as useDirectTurnOn,
} from "@glasshome/sync-layer/solid";
import { useContext } from "solid-js";
import type { NoFormattedFields } from "../i18n/format";
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

/** Data refuses formatted text, as `ServiceCallFn` does. */
export type ServiceShortcut = <D extends object & NoFormattedFields<D> = Record<string, unknown>>(
  entityId: string | string[],
  serviceData?: D,
) => Promise<void>;

function shortcut(
  call: ServiceCallFn,
  service: "turn_on" | "turn_off" | "toggle",
): ServiceShortcut {
  return async (entityId: string | string[], serviceData: object = {}) => {
    await call(entityDomain(entityId), service, serviceData as Record<string, unknown>, {
      entity_id: entityId,
    });
  };
}

export function useService(): {
  callService: ServiceCallFn;
  turnOn: ServiceShortcut;
  turnOff: ServiceShortcut;
  toggle: ServiceShortcut;
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

export function useTurnOn(): ServiceShortcut {
  const routed = useContext(WidgetCtx)?.callService;
  return routed ? shortcut(routed, "turn_on") : useDirectTurnOn();
}

export function useTurnOff(): ServiceShortcut {
  const routed = useContext(WidgetCtx)?.callService;
  return routed ? shortcut(routed, "turn_off") : useDirectTurnOff();
}

export function useToggle(): ServiceShortcut {
  const routed = useContext(WidgetCtx)?.callService;
  return routed ? shortcut(routed, "toggle") : useDirectToggle();
}
