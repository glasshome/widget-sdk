/**
 * Value Interpretation Utility
 *
 * Provides semantic interpretation of numeric values based on unit.
 *
 * @example
 * ```tsx
 * interpretValue(22, "°C")   // "Warm"
 * interpretValue(5, "°C")    // "Cold"
 * interpretValue(75, "%")    // "High"
 * interpretValue(400, "ppm") // "Good" (for CO2)
 * ```
 */

import { sdkI18n } from "../i18n/sdk-text";

/**
 * Interpret a numeric value semantically
 */
export function interpretValue(value: number, unit?: string): string | null {
  if (value == null || isNaN(value)) {
    return null;
  }
  const { text } = sdkI18n();

  // Temperature Celsius
  if (unit === "°C") {
    if (value < 10) return text("sdk.interpret.cold");
    if (value < 18) return text("sdk.interpret.cool");
    if (value < 24) return text("sdk.interpret.comfortable");
    if (value < 28) return text("sdk.interpret.warm");
    return text("sdk.interpret.hot");
  }

  // Temperature Fahrenheit
  if (unit === "°F") {
    if (value < 50) return text("sdk.interpret.cold");
    if (value < 64) return text("sdk.interpret.cool");
    if (value < 75) return text("sdk.interpret.comfortable");
    if (value < 82) return text("sdk.interpret.warm");
    return text("sdk.interpret.hot");
  }

  // Percentage (general)
  if (unit === "%") {
    if (value < 20) return text("sdk.interpret.very-low");
    if (value < 40) return text("sdk.interpret.low");
    if (value < 60) return text("sdk.interpret.medium");
    if (value < 80) return text("sdk.interpret.high");
    return text("sdk.interpret.very-high");
  }

  // CO2 levels (ppm)
  if (unit === "ppm") {
    if (value < 400) return text("sdk.interpret.excellent");
    if (value < 600) return text("sdk.interpret.good");
    if (value < 1000) return text("sdk.interpret.acceptable");
    if (value < 1500) return text("sdk.interpret.mediocre");
    return text("sdk.interpret.poor");
  }

  // Brightness/Intensity (lux)
  if (unit === "lx") {
    if (value < 50) return text("sdk.interpret.dark");
    if (value < 200) return text("sdk.interpret.dim");
    if (value < 500) return text("sdk.interpret.moderate");
    if (value < 1000) return text("sdk.interpret.bright");
    return text("sdk.interpret.very-bright");
  }

  // Air Quality Index (AQI)
  if (unit === "AQI") {
    if (value <= 50) return text("sdk.interpret.good");
    if (value <= 100) return text("sdk.interpret.moderate");
    if (value <= 150) return text("sdk.interpret.unhealthy-sensitive");
    if (value <= 200) return text("sdk.interpret.unhealthy");
    if (value <= 300) return text("sdk.interpret.very-unhealthy");
    return text("sdk.interpret.hazardous");
  }

  // Decibels (noise level)
  if (unit === "dB") {
    if (value < 30) return text("sdk.interpret.very-quiet");
    if (value < 50) return text("sdk.interpret.quiet");
    if (value < 70) return text("sdk.interpret.moderate");
    if (value < 85) return text("sdk.interpret.loud");
    return text("sdk.interpret.very-loud");
  }

  return null;
}
