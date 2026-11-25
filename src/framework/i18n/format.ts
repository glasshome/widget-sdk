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

export type FormattedPart = { type: Intl.DateTimeFormatPartTypes; value: FormattedText };

function datePartsIn(
  locale: string,
  value: Date | number,
  options?: Intl.DateTimeFormatOptions,
): FormattedPart[] {
  const parts = cachedIntl(
    "date",
    locale,
    options,
    () => new Intl.DateTimeFormat(locale, options),
  ).formatToParts(value);
  return parts.map((part) => ({ type: part.type, value: display(part.value) }));
}

export interface ZonedTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 to 6, from Sunday. */
  weekday: number;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** The wall-clock numbers of `value` in `timeZone` (default: the device's), whatever the member's locale. */
export function zonedTime(value: Date | number, timeZone?: string): ZonedTime {
  const options: Intl.DateTimeFormatOptions = {
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
    timeZone,
  };
  const parts = cachedIntl(
    "zoned",
    "en-US",
    options,
    () => new Intl.DateTimeFormat("en-US", options),
  ).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: WEEKDAYS[read("weekday")] ?? 0,
  };
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
  const format: Intl.NumberFormatOptions = {
    signDisplay: "negative",
    ...(options.digits !== undefined && {
      minimumFractionDigits: options.digits,
      maximumFractionDigits: options.digits,
    }),
  };
  const number = cachedIntl("number", locale, format, () => new Intl.NumberFormat(locale, format));
  return display(`${number.format(value)} ${options.unit ?? "°C"}`);
}

export interface Formatters {
  formatNumber: (n: number, options?: Intl.NumberFormatOptions) => FormattedText;
  formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => FormattedText;
  formatDateParts: (value: Date | number, options?: Intl.DateTimeFormatOptions) => FormattedPart[];
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
    formatDateParts: (value, options) => datePartsIn(formattingOf(scope), value, options),
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

export function formatDateParts(
  value: Date | number,
  options?: Intl.DateTimeFormatOptions,
): FormattedPart[] {
  return datePartsIn(formattingOf(i18nScope("formatDateParts")), value, options);
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
