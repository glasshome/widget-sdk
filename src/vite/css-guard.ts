import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// :host definitions of document theme variables freeze them in the shadow root and stop widgets following the theme.
const FORBIDDEN_HOST_THEME_VARS = [
  "--radius",
  "--background",
  "--foreground",
  "--card",
  "--primary",
  "--border",
  "--muted",
  "--accent",
];

// Tailwind emits `--x: var(--x)` on :host for self-mapped theme keys; the cycle blocks the inherited value.
export function dropSelfReferencingVars(css: string): string {
  return css.replace(/(?<=[{;])\s*(--[\w-]+)\s*:\s*var\(\s*\1\s*\)\s*(;|(?=\}))/g, "");
}

export function assertNoHostThemeVars(outDir: string, name: string): void {
  const cssFile = join(outDir, `${name}.css`);
  if (!existsSync(cssFile)) return;
  const emitted = readFileSync(cssFile, "utf-8");
  const css = dropSelfReferencingVars(emitted);
  if (css !== emitted) writeFileSync(cssFile, css);
  // Theme vars under :root are inert in a shadow root (harmless); only :host
  // definitions override inheritance.
  for (const match of css.matchAll(/:host[^{]*\{([^}]*)\}/g)) {
    const body = match[1] ?? "";
    const offender = FORBIDDEN_HOST_THEME_VARS.find((v) => body.includes(`${v}:`));
    if (offender) {
      throw new Error(
        `[glasshome-widget] "${name}.css" defines theme variable "${offender}" on :host. ` +
          `Theme variables must inherit from the document so widgets follow the household ` +
          `theme, never re-scope them into the widget's shadow root.`,
      );
    }
  }
}
