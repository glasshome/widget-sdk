/**
 * Theme utilities — plain DOM reads.
 * Framework-agnostic: no SolidJS imports.
 *
 * These functions read CSS custom properties and class state from the
 * document root. They are synchronous and work in any browser environment.
 */

/**
 * Cached live CSSStyleDeclaration for the document root.
 * `getComputedStyle` returns a live object that auto-updates when styles
 * change, so we only need to call it once. Subsequent reads via
 * `.getPropertyValue()` reflect current values without triggering a
 * new style resolution (the browser may still need a reflow for dirty
 * properties, but we avoid the per-call overhead of `getComputedStyle`).
 */
let cachedRootStyle: CSSStyleDeclaration | null = null;

function getRootStyle(): CSSStyleDeclaration {
  if (!cachedRootStyle) {
    cachedRootStyle = getComputedStyle(document.documentElement);
  }
  return cachedRootStyle;
}

/**
 * Read a CSS custom property (theme token) from the document root.
 * Automatically prepends "--" if not already present.
 *
 * @example
 * getThemeToken("color-primary")  // reads --color-primary
 * getThemeToken("--color-primary") // also works
 */
export function getThemeToken(name: string): string {
  const varName = name.startsWith("--") ? name : `--${name}`;
  return getRootStyle().getPropertyValue(varName).trim();
}

/**
 * Check whether the current theme is dark mode.
 * Reads the presence of the "dark" class on <html>.
 */
export function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}
