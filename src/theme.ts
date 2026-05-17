/**
 * Theme utilities — plain DOM reads.
 * Framework-agnostic: no SolidJS imports.
 */

/**
 * Check whether the current theme is dark mode.
 * Reads the presence of the "dark" class on <html>.
 */
export function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}
