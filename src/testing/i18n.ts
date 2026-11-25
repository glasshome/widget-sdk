import type { CompiledCatalog } from "@glasshome/widget-contract/i18n-format";
import type { StateTexts } from "@glasshome/widget-contract/state-texts";
import { createComponent, type JSX } from "solid-js";
import { type ReactiveWidgetContext, WidgetCtx } from "../framework/hooks/use-widget-context";
import {
  formattingOf,
  type I18nScope,
  resolvedLanguage,
  type WidgetI18n,
} from "../framework/i18n/context";
import { formattersOf } from "../framework/i18n/format";
import { I18nProvider } from "../framework/i18n/provider";
import { stateTranslator } from "../framework/i18n/state";
import { translator, type TranslationTools } from "../framework/i18n/translate";

export interface TestLanguage {
  language: string;
  formatting: string;
  catalog: CompiledCatalog | null;
  english: CompiledCatalog | null;
  states?: StateTexts | null;
  dimensions?: { width: number; height: number };
}

const DEFAULT_DIMENSIONS = { width: 400, height: 300 };

function i18nOf(language: TestLanguage): WidgetI18n {
  return {
    language: language.language,
    formatting: language.formatting,
    catalog: language.catalog,
    sdk: null,
    ui: null,
    states: language.states ?? null,
  };
}

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

export function languageTools(language: TestLanguage): TranslationTools {
  const scope: I18nScope = { i18n: () => i18nOf(language), messages: language.english };
  return {
    t: translator(scope),
    language: () => resolvedLanguage(scope),
    locale: () => formattingOf(scope),
    translateState: stateTranslator(scope),
    ...formattersOf(scope),
  };
}
