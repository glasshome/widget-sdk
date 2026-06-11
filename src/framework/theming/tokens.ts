/// <reference path="./tokens.css.d.ts" />
import tokensCss from "./tokens.css?raw";

/**
 * Minimal document-shape needed for token injection. Allows tests to pass
 * a stub without a full DOM implementation.
 */
export interface InjectTokensRoot {
  head: {
    appendChild: (node: unknown) => void;
    querySelector?: (sel: string) => unknown;
  };
  createElement: (tag: string) => {
    setAttribute: (name: string, value: string) => void;
    textContent: string | null;
  };
}

let injected = false;
let constructedSheet: CSSStyleSheet | undefined;
const adoptedRoots = new WeakSet<ShadowRoot>();

/** Lazy singleton constructed stylesheet shared across all shadow roots. */
function getConstructedSheet(): CSSStyleSheet {
  if (!constructedSheet) {
    constructedSheet = new CSSStyleSheet();
    // `:root` and `.dark` match nothing inside a shadow tree. The host
    // mirrors the document's `dark` class onto the shadow host element, so
    // re-scoping both to :host makes the sheet self-sufficient in a shadow
    // root (no reliance on document-level variable inheritance).
    constructedSheet.replaceSync(
      tokensCss.replace(/:root\b/g, ":host").replace(/^\.dark\b/gm, ":host(.dark)"),
    );
  }
  return constructedSheet;
}

/**
 * Inject the SDK tokens stylesheet into the widget's root.
 *
 * ShadowRoot: adopts a shared constructed CSSStyleSheet (one instance for
 * all widget shadow roots), idempotent per root via WeakSet.
 *
 * Document (or no argument, legacy): appends a <style> to <head>.
 * Idempotent across:
 *  - Repeated calls within the same module instance (boolean sentinel).
 *  - Multiple SDK module instances (DOM sentinel data-glasshome-tokens).
 *  - SSR / non-browser environments (no-op when document is undefined).
 */
export function injectTokens(root?: Document | ShadowRoot): void {
  if (typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot) {
    if (adoptedRoots.has(root)) return;
    const sheet = getConstructedSheet();
    if (!root.adoptedStyleSheets.includes(sheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    }
    adoptedRoots.add(root);
    return;
  }

  if (injected) return;
  const doc =
    (root as unknown as InjectTokensRoot | undefined) ??
    (typeof document === "undefined"
      ? undefined
      : (document as unknown as InjectTokensRoot));
  if (!doc) return;
  if (doc.head.querySelector?.("style[data-glasshome-tokens]")) {
    injected = true;
    return;
  }
  const style = doc.createElement("style");
  style.setAttribute("data-glasshome-tokens", "");
  style.textContent = tokensCss;
  doc.head.appendChild(style);
  injected = true;
}

/** Test-only: reset the module-level sentinel. Not exported from the package root. */
export function __resetInjectedForTests(): void {
  injected = false;
}
