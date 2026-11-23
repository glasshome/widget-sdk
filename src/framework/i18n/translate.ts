import { formatMessage } from "@glasshome/widget-contract/i18n-format";
import {
  formattingOf,
  type I18nScope,
  i18nScope,
  messageEnv,
  messageOf,
  resolvedLanguage,
} from "./context";
import { type Formatters, formattersOf } from "./format";
import { stateTranslator, type TranslateState } from "./state";

export type TranslateArgs = Readonly<Record<string, string | number>>;
export type Translate = (key: string, args?: TranslateArgs) => string;

export function translator(scope: I18nScope): Translate {
  return (key, args = {}) => {
    const current = scope.i18n();
    const formatting = formattingOf(scope);
    const own = messageOf(current?.catalog, key);
    if (current && own) return formatMessage(own, args, messageEnv(current.language, formatting));
    const english = messageOf(scope.messages, key);
    if (english) return formatMessage(english, args, messageEnv("en", formatting));
    return key;
  };
}

/**
 * The text for `key` in the member's language, else the widget's bundled English, else the key.
 * Reads the widget it runs in, so call it while rendering; an event handler takes `t` from `useTranslation()`.
 */
export function t(key: string, args?: TranslateArgs): string {
  return translator(i18nScope("t"))(key, args);
}

/** Everything here keeps the widget it was taken in, so it also works in handlers, timers and after `await`. */
export function useTranslation(): Formatters & {
  t: Translate;
  /** The language this widget's words resolved to: the member's when the widget has that catalog, else `en`. */
  language: () => string;
  /** The locale numbers and dates take. */
  locale: () => string;
  translateState: TranslateState;
} {
  const scope = i18nScope("useTranslation");
  return {
    t: translator(scope),
    language: () => resolvedLanguage(scope),
    locale: () => formattingOf(scope),
    translateState: stateTranslator(scope),
    ...formattersOf(scope),
  };
}
