import type {
  CompiledCatalog,
  CompiledMessage,
  FormatEnv,
} from "@glasshome/widget-contract/i18n-format";
import type { StateTexts } from "@glasshome/widget-contract/state-texts";
import { createContext, useContext } from "solid-js";
import { WidgetCtx } from "../hooks/use-widget-context";

/** The member's language and the catalogs the host holds for this widget instance. */
export interface WidgetI18n {
  /** The member's language, such as `fr`. */
  language: string;
  /** The locale numbers and dates take, such as `fr-FR`. */
  formatting: string;
  /** This widget's catalog in `language`; null until it arrives or when the widget has none. */
  catalog: CompiledCatalog | null;
  sdk: CompiledCatalog | null;
  ui: CompiledCatalog | null;
  /** Home Assistant's state texts this widget may read; null until they arrive. */
  states: StateTexts | null;
}

export const ENGLISH = "en";

export const BundledMessages = createContext<CompiledCatalog | null>(null);

export interface I18nScope {
  i18n: () => WidgetI18n | undefined;
  messages: CompiledCatalog | null;
}

export function i18nScope(name: string): I18nScope {
  const ctx = useContext(WidgetCtx);
  if (!ctx) throw new Error(`${name}() must run inside a widget`);
  return { i18n: () => ctx.i18n?.(), messages: useContext(BundledMessages) };
}

export const formattingOf = (scope: I18nScope): string => scope.i18n()?.formatting ?? ENGLISH;

export function resolvedLanguage(scope: I18nScope): string {
  const current = scope.i18n();
  return current?.catalog ? current.language : ENGLISH;
}

export function messageOf(
  catalog: CompiledCatalog | null | undefined,
  key: string,
): CompiledMessage | undefined {
  return catalog && Object.hasOwn(catalog, key) ? catalog[key] : undefined;
}

const intl = new Map<string, unknown>();

export function cachedIntl<T>(
  kind: string,
  locale: string,
  options: object | undefined,
  make: () => T,
): T {
  const id = `${kind}|${locale}|${JSON.stringify(options ?? {})}`;
  let hit = intl.get(id) as T | undefined;
  if (hit === undefined) {
    hit = make();
    intl.set(id, hit);
  }
  return hit;
}

export function messageEnv(language: string, formatting: string): FormatEnv {
  const rules = cachedIntl("plural", language, undefined, () => new Intl.PluralRules(language));
  const numbers = cachedIntl(
    "number",
    formatting,
    undefined,
    () => new Intl.NumberFormat(formatting),
  );
  return { plural: (n) => rules.select(n), number: (n) => numbers.format(n) };
}
