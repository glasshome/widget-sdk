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

/**
 * Interpret a numeric value semantically
 */
export function interpretValue(value: number, unit?: string): string | null {
  if (value == null || isNaN(value)) {
    return null;
  }

  // Temperature Celsius
  if (unit === "°C") {
    if (value < 10) return "Cold";
    if (value < 18) return "Cool";
    if (value < 24) return "Comfortable";
    if (value < 28) return "Warm";
    return "Hot";
  }

  // Temperature Fahrenheit
  if (unit === "°F") {
    if (value < 50) return "Cold";
    if (value < 64) return "Cool";
    if (value < 75) return "Comfortable";
    if (value < 82) return "Warm";
    return "Hot";
  }

  // Percentage (general)
  if (unit === "%") {
    if (value < 20) return "Very Low";
    if (value < 40) return "Low";
    if (value < 60) return "Medium";
    if (value < 80) return "High";
    return "Very High";
  }

  // CO2 levels (ppm)
  if (unit === "ppm") {
    if (value < 400) return "Excellent";
    if (value < 600) return "Good";
    if (value < 1000) return "Acceptable";
    if (value < 1500) return "Mediocre";
    return "Poor";
  }

  // Brightness/Intensity (lux)
  if (unit === "lx") {
    if (value < 50) return "Dark";
    if (value < 200) return "Dim";
    if (value < 500) return "Moderate";
    if (value < 1000) return "Bright";
    return "Very Bright";
  }

  // Air Quality Index (AQI)
  if (unit === "AQI") {
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    if (value <= 150) return "Unhealthy for Sensitive";
    if (value <= 200) return "Unhealthy";
    if (value <= 300) return "Very Unhealthy";
    return "Hazardous";
  }

  // Decibels (noise level)
  if (unit === "dB") {
    if (value < 30) return "Very Quiet";
    if (value < 50) return "Quiet";
    if (value < 70) return "Moderate";
    if (value < 85) return "Loud";
    return "Very Loud";
  }

  return null;
}
