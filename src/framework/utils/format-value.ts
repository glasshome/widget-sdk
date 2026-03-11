/**
 * Value Formatting Utility
 *
 * Formats numeric values with units, applying smart scaling for large numbers.
 *
 * @example
 * ```tsx
 * formatValue(22, "°C")      // "22°C"
 * formatValue(1234, "W")     // "1.2kW"
 * formatValue(0.5, "")       // "0.5"
 * formatValue(1500000, "W")  // "1.5MW"
 * ```
 */

/**
 * Format a numeric value with optional unit and smart scaling
 */
export function formatValue(
  value: number | string,
  unit?: string,
  options?: {
    /** Number of decimal places (default: auto) */
    decimals?: number;
    /** Enable smart scaling for large numbers (default: true) */
    scale?: boolean;
  },
): string {
  const { decimals, scale = true } = options || {};

  // Handle string values
  if (typeof value === "string") {
    return unit ? `${value}${unit}` : value;
  }

  // Handle null/undefined
  if (value == null || Number.isNaN(value)) {
    return unit ? `--${unit}` : "--";
  }

  let formattedValue = value;
  let formattedUnit = unit || "";

  // Apply smart scaling for power units
  if (scale && unit && (unit === "W" || unit === "kW" || unit === "MW")) {
    if (value >= 1000000) {
      formattedValue = value / 1000000;
      formattedUnit = "MW";
    } else if (value >= 1000) {
      formattedValue = value / 1000;
      formattedUnit = "kW";
    } else {
      formattedUnit = "W";
    }
  }

  // Apply smart scaling for bytes
  if (scale && unit && (unit === "B" || unit === "KB" || unit === "MB" || unit === "GB")) {
    if (value >= 1073741824) {
      // 1024^3
      formattedValue = value / 1073741824;
      formattedUnit = "GB";
    } else if (value >= 1048576) {
      // 1024^2
      formattedValue = value / 1048576;
      formattedUnit = "MB";
    } else if (value >= 1024) {
      formattedValue = value / 1024;
      formattedUnit = "KB";
    } else {
      formattedUnit = "B";
    }
  }

  // Format decimals
  let formatted: string;
  if (decimals !== undefined) {
    formatted = formattedValue.toFixed(decimals);
  } else {
    // Auto decimals: show 1 decimal if scaled, 0 if integer, 1-2 if float
    if (formattedValue !== value) {
      // Was scaled
      formatted = formattedValue.toFixed(1);
    } else if (Number.isInteger(value)) {
      formatted = value.toString();
    } else {
      // Float - show up to 2 decimals, remove trailing zeros
      formatted = Number.parseFloat(value.toFixed(2)).toString();
    }
  }

  return formattedUnit ? `${formatted}${formattedUnit}` : formatted;
}
