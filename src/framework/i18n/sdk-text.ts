import { formatMessage } from "@glasshome/widget-contract/i18n-format";
import { useContext } from "solid-js";
import { WidgetCtx } from "../hooks/use-widget-context";
import english, { type SdkKey } from "../../locales/compiled/en";
import { HostI18nContext, type I18nScope, messageEnv, messageOf } from "./context";
import { type Formatters, formattersOf } from "./format";
import { stateTranslator, type TranslateState } from "./state";
import type { TranslateArgs } from "./translate";

export interface SdkI18n extends Formatters {
  translateState: TranslateState;
  text: (key: SdkKey, args?: TranslateArgs) => string;
}

/** The SDK's own words and numbers for the widget this runs in, else the host's; English with neither. */
export function sdkI18n(): SdkI18n {
  const ctx = useContext(WidgetCtx);
  const host = useContext(HostI18nContext);
  const scope: I18nScope = { i18n: () => ctx?.i18n?.() ?? host(), messages: null };
  return {
    ...formattersOf(scope),
    translateState: stateTranslator(scope),
    text: (key, args = {}) => {
      const current = scope.i18n();
      const formatting = current?.formatting ?? "en";
      const own = messageOf(current?.sdk, key);
      if (current && own) return formatMessage(own, args, messageEnv(current.language, formatting));
      return formatMessage(english[key], args, messageEnv("en", formatting));
    },
  };
}
