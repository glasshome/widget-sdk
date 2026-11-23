import { LocaleProvider } from "@glasshome/ui/solid";
import type { CompiledCatalog } from "@glasshome/widget-contract/i18n-format";
import { createComponent, type JSX, useContext } from "solid-js";
import { WidgetCtx } from "../hooks/use-widget-context";
import { BundledMessages, ENGLISH } from "./context";

export function I18nProvider(props: {
  messages: CompiledCatalog | null;
  children: JSX.Element;
}): JSX.Element {
  const ctx = useContext(WidgetCtx);
  const i18n = () => ctx?.i18n?.();
  return createComponent(BundledMessages.Provider, {
    get value() {
      return props.messages;
    },
    get children() {
      return createComponent(LocaleProvider, {
        get language() {
          const current = i18n();
          return current?.ui ? current.language : ENGLISH;
        },
        get formatting() {
          return i18n()?.formatting ?? ENGLISH;
        },
        get messages() {
          return i18n()?.ui ?? undefined;
        },
        get children() {
          return props.children;
        },
      });
    },
  });
}
