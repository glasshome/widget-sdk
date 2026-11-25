import { createComponent, type JSX } from "solid-js";
import { type ReactiveWidgetContext, WidgetCtx } from "../framework/hooks/use-widget-context";
import { I18nProvider } from "../framework/i18n/provider";
import { i18nOf, type TestLanguage } from "./tools";

const DEFAULT_DIMENSIONS = { width: 400, height: 300 };

export function WidgetLanguage(props: TestLanguage & { children: JSX.Element }): JSX.Element {
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    dimensions: () => props.dimensions ?? DEFAULT_DIMENSIONS,
    i18n: () => i18nOf(props),
  };
  return createComponent(WidgetCtx.Provider, {
    value: ctx,
    get children() {
      return createComponent(I18nProvider, {
        get messages() {
          return props.english;
        },
        get children() {
          return props.children;
        },
      });
    },
  });
}
