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

/**
 * Inject the SDK tokens stylesheet into <head>. Idempotent across:
 *  - Repeated calls within the same module instance (boolean sentinel).
 *  - Multiple SDK module instances (DOM sentinel data-glasshome-tokens).
 *  - SSR / non-browser environments (no-op when document is undefined).
 */
export function injectTokens(doc?: InjectTokensRoot): void {
  if (injected) return;
  const root =
    doc ??
    (typeof document === "undefined"
      ? undefined
      : (document as unknown as InjectTokensRoot));
  if (!root) return;
  if (root.head.querySelector?.("style[data-glasshome-tokens]")) {
    injected = true;
    return;
  }
  const style = root.createElement("style");
  style.setAttribute("data-glasshome-tokens", "");
  style.textContent = tokensCss;
  root.head.appendChild(style);
  injected = true;
}

/** Test-only: reset the module-level sentinel. Not exported from the package root. */
export function __resetInjectedForTests(): void {
  injected = false;
}
