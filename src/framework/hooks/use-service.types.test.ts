import { expectTypeOf, test } from "bun:test";
import { formatDate, formatNumber, t } from "../i18n";
import type { useService } from "./use-service";
import type { ServiceCallFn } from "./use-widget-context";

type HostCall = (
  domain: string,
  service: string,
  serviceData?: Record<string, unknown>,
  target?: Record<string, unknown>,
  options?: { returnResponse?: boolean },
) => Promise<unknown>;

test("service data refuses formatted text at any depth", () => {
  const typesOnly = (service: ReturnType<typeof useService>, d: Date) => {
    // @ts-expect-error formatted text is display, never data
    void service.callService("climate", "set_temperature", { temperature: formatNumber(21.5) });
    void service.callService("climate", "set_temperature", {
      // @ts-expect-error a nested formatted value is refused too
      data: { temperature: formatNumber(21.5) },
    });
    // @ts-expect-error a formatted value inside an array is refused
    void service.callService("notify", "send", { list: [formatDate(d)] });
    // @ts-expect-error the shortcuts refuse it as well
    void service.turnOn("light.kitchen", { brightness: formatNumber(40) });
    // @ts-expect-error turnOff refuses it
    void service.turnOff("light.kitchen", { transition: formatNumber(2) });
    // @ts-expect-error toggle refuses it
    void service.toggle("light.kitchen", { transition: formatNumber(2) });
  };
  expectTypeOf(typesOnly).toBeFunction();
});

test("plain numbers and translated words stay valid data", () => {
  const typesOnly = (service: ReturnType<typeof useService>) => {
    void service.callService("climate", "set_temperature", { temperature: 21.5 });
    void service.callService("notify", "send", { message: t("x") });
    void service.turnOn(["light.kitchen", "light.hall"], { brightness_pct: 40 });
    void service.toggle("light.kitchen");
  };
  expectTypeOf(typesOnly).toBeFunction();
});

test("the host's implementation still satisfies the type", () => {
  expectTypeOf<HostCall>().toExtend<ServiceCallFn>();
});
