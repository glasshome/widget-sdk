import { cachedIntl, formattingOf, i18nScope } from "./context";

/** Text made for display. Service calls refuse it: send the number, never its formatted text. */
export type FormattedText = string & { readonly __formatted: true };

const display = (text: string) => text as FormattedText;

export function formatNumber(n: number, options?: Intl.NumberFormatOptions): FormattedText {
  const locale = formattingOf(i18nScope("formatNumber"));
  return display(
    cachedIntl("number", locale, options, () => new Intl.NumberFormat(locale, options)).format(n),
  );
}

export function formatDate(
  value: Date | number,
  options?: Intl.DateTimeFormatOptions,
): FormattedText {
  const locale = formattingOf(i18nScope("formatDate"));
  return display(
    cachedIntl("date", locale, options, () => new Intl.DateTimeFormat(locale, options)).format(
      value,
    ),
  );
}

export function formatRelative(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): FormattedText {
  const locale = formattingOf(i18nScope("formatRelative"));
  return display(
    cachedIntl(
      "relative",
      locale,
      options,
      () => new Intl.RelativeTimeFormat(locale, options),
    ).format(value, unit),
  );
}

/** Writes `value` in `unit` (default `°C`) as given; it never converts between units. */
export function formatTemperature(
  value: number,
  options: { unit?: "°C" | "°F"; digits?: number } = {},
): FormattedText {
  const locale = formattingOf(i18nScope("formatTemperature"));
  const digits =
    options.digits === undefined
      ? undefined
      : { minimumFractionDigits: options.digits, maximumFractionDigits: options.digits };
  const number = cachedIntl("number", locale, digits, () => new Intl.NumberFormat(locale, digits));
  return display(`${number.format(value)} ${options.unit ?? "°C"}`);
}

/** `T` with every `FormattedText` inside it, at any depth, turned to `never`. */
export type NoFormatted<T> = T extends FormattedText
  ? never
  : T extends (...args: never[]) => unknown
    ? T
    : T extends object
      ? { [K in keyof T]: NoFormatted<T[K]> }
      : T;

/** Service data whose fields hold no `FormattedText`; as a constraint, `D extends NoFormattedFields<D>`. */
export type NoFormattedFields<D> = { [K in keyof D]: NoFormatted<D[K]> };
