import { cachedIntl, formattingOf, type I18nScope, i18nScope } from "./context";

/** Text made for display. Service calls refuse it: send the number, never its formatted text. */
export type FormattedText = string & { readonly __formatted: true };

const display = (text: string) => text as FormattedText;

function numberIn(locale: string, n: number, options?: Intl.NumberFormatOptions): FormattedText {
  return display(
    cachedIntl("number", locale, options, () => new Intl.NumberFormat(locale, options)).format(n),
  );
}

function dateIn(
  locale: string,
  value: Date | number,
  options?: Intl.DateTimeFormatOptions,
): FormattedText {
  return display(
    cachedIntl("date", locale, options, () => new Intl.DateTimeFormat(locale, options)).format(
      value,
    ),
  );
}

function relativeIn(
  locale: string,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): FormattedText {
  return display(
    cachedIntl(
      "relative",
      locale,
      options,
      () => new Intl.RelativeTimeFormat(locale, options),
    ).format(value, unit),
  );
}

export interface TemperatureOptions {
  unit?: "°C" | "°F";
  digits?: number;
}

function temperatureIn(
  locale: string,
  value: number,
  options: TemperatureOptions = {},
): FormattedText {
  const digits =
    options.digits === undefined
      ? undefined
      : { minimumFractionDigits: options.digits, maximumFractionDigits: options.digits };
  const number = cachedIntl("number", locale, digits, () => new Intl.NumberFormat(locale, digits));
  return display(`${number.format(value)} ${options.unit ?? "°C"}`);
}

export interface Formatters {
  formatNumber: (n: number, options?: Intl.NumberFormatOptions) => FormattedText;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => FormattedText;
  formatRelative: (
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: Intl.RelativeTimeFormatOptions,
  ) => FormattedText;
  formatTemperature: (value: number, options?: TemperatureOptions) => FormattedText;
}

export function formattersOf(scope: I18nScope): Formatters {
  return {
    formatNumber: (n, options) => numberIn(formattingOf(scope), n, options),
    formatDate: (value, options) => dateIn(formattingOf(scope), value, options),
    formatRelative: (value, unit, options) => relativeIn(formattingOf(scope), value, unit, options),
    formatTemperature: (value, options) => temperatureIn(formattingOf(scope), value, options),
  };
}

export function formatNumber(n: number, options?: Intl.NumberFormatOptions): FormattedText {
  return numberIn(formattingOf(i18nScope("formatNumber")), n, options);
}

export function formatDate(
  value: Date | number,
  options?: Intl.DateTimeFormatOptions,
): FormattedText {
  return dateIn(formattingOf(i18nScope("formatDate")), value, options);
}

export function formatRelative(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): FormattedText {
  return relativeIn(formattingOf(i18nScope("formatRelative")), value, unit, options);
}

/** Writes `value` in `unit` (default `°C`) as given; it never converts between units. */
export function formatTemperature(value: number, options?: TemperatureOptions): FormattedText {
  return temperatureIn(formattingOf(i18nScope("formatTemperature")), value, options);
}

/** `T` with every `FormattedText` inside it, at any depth, turned to a type that names the fix. */
export type NoFormatted<T> = T extends FormattedText
  ? "send the number, never formatted text"
  : T extends (...args: never[]) => unknown
    ? T
    : T extends object
      ? { [K in keyof T]: NoFormatted<T[K]> }
      : T;

/** Service data whose fields hold no `FormattedText`; as a constraint, `D extends NoFormattedFields<D>`. */
export type NoFormattedFields<D> = { [K in keyof D]: NoFormatted<D[K]> };
