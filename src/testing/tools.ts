import type { CompiledCatalog } from "@glasshome/widget-contract/i18n-format";
import type { StateTexts } from "@glasshome/widget-contract/state-texts";
import {
  formattingOf,
  type I18nScope,
  resolvedLanguage,
  type WidgetI18n,
} from "../framework/i18n/context";
import { formattersOf } from "../framework/i18n/format";
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

export function i18nOf(language: TestLanguage): WidgetI18n {
  return {
    language: language.language,
    formatting: language.formatting,
    catalog: language.catalog,
    sdk: null,
    ui: null,
    states: language.states ?? null,
  };
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
