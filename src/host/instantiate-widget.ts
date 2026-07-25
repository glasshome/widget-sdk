import { type Accessor, createComponent, ErrorBoundary } from "solid-js";
import { render } from "solid-js/web";
import { injectTokens } from "../framework/theming";
import { WidgetCtx } from "../framework/hooks/use-widget-context";
import type { ReactiveWidgetContext } from "../framework/hooks/use-widget-context";
import type { WidgetDefinition } from "../types";

export interface WidgetInstanceHandle {
  dispose: () => void;
}

export interface MountOptions {
  definition: WidgetDefinition;
  /** Read inside the shadow render root so config changes propagate reactively across it. */
  config: Accessor<Record<string, unknown>>;
  /** Host context, re-provided inside the new render root (context does not cross roots). */
  ctx: ReactiveWidgetContext;
  /** Per-widget stylesheet text fetched by the host; null when the widget ships no CSS. */
  cssText: string | null;
  /** Called when the widget tree throws; the host owns crash counting and remount. */
  onCrash: (error: Error) => void;
  /**
   * Extra sheets adopted AFTER the widget's own CSS, so their `!important` rules
   * win ties. The host supplies these for effects it drives from outside the
   * shadow (e.g. performant-blur / a11y overrides keyed on a mirrored class).
   * Injection of SDK tokens is unchanged and never includes ui theme tokens.
   */
  extraSheets?: CSSStyleSheet[];
  /**
   * Document classes mirrored onto the shadow host so `:host(.x)` variants match
   * (descendant selectors like `.dark *` cannot cross the boundary). Defaults to
   * `["dark"]` — the SDK's dark variant. A host adds its own (reduce-blur,
   * reduce-motion, perf-blur, …) when it ships sheets keyed on them.
   */
  mirrorClasses?: string[];
}

// Content-addressed sheet cache: N instances of the same widget receive the
// same cssText string, so they share one constructed sheet instead of parsing
// the CSS once per instance.
const sheetCache = new Map<string, CSSStyleSheet>();

function getWidgetSheet(cssText: string): CSSStyleSheet {
  const cached = sheetCache.get(cssText);
  if (cached) return cached;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  sheetCache.set(cssText, sheet);
  return sheet;
}

// One MutationObserver serves every mounted host: it mirrors the tracked
// document classes onto each registered host whenever documentElement's class
// list changes. The set of tracked classes is the union of every mount's
// mirrorClasses, so a single observer covers hosts with differing needs.
const trackedClasses = new Set<string>();
const mirroredHosts = new Map<HTMLElement, string[]>();
let observerStarted = false;

function syncHostClasses(host: HTMLElement, classes: string[]): void {
  for (const cls of classes) {
    host.classList.toggle(cls, document.documentElement.classList.contains(cls));
  }
}

function observeHostClasses(host: HTMLElement, classes: string[]): () => void {
  for (const cls of classes) trackedClasses.add(cls);
  mirroredHosts.set(host, classes);
  syncHostClasses(host, classes);
  if (!observerStarted) {
    observerStarted = true;
    new MutationObserver(() => {
      for (const [h, cls] of mirroredHosts) syncHostClasses(h, cls);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
  return () => {
    mirroredHosts.delete(host);
  };
}

/**
 * Mount a widget into a closed shadow root on `host`.
 *
 * The only ShadowRoot reference lives in this closure — `mode: "closed"` keeps
 * it off `host.shadowRoot`, so neither the widget nor another bundle can reach
 * into a foreign widget's DOM through the host element.
 *
 * This is the framework half of the widget host contract, shared by dash, the
 * preview harness, and the hub render worker. It attaches the shadow, injects
 * SDK tokens (tones + widget vars only — the ui theme reaches widgets by
 * document inheritance, never pinned on `:host`), adopts the widget's CSS and
 * any host `extraSheets`, mirrors the requested document classes, and renders
 * the widget under a re-provided `WidgetCtx` and a crash boundary. Trust
 * boundary steps that are host-specific (freeze-intrinsics, capability
 * enforcement) stay in the host and are not part of this recipe.
 */
export function instantiateWidget(host: HTMLElement, opts: MountOptions): WidgetInstanceHandle {
  const shadow = host.attachShadow({ mode: "closed" });
  const stopClassSync = observeHostClasses(host, opts.mirrorClasses ?? ["dark"]);

  // Tokens adopted by the host directly — widgets that never mount <Widget>
  // (or mount it late) still get the shell rules. Idempotent with the SDK's
  // own injectTokens call from <Widget>.
  injectTokens(shadow);
  if (opts.cssText !== null) {
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, getWidgetSheet(opts.cssText)];
  }
  // Adopted last so host overrides win `!important` ties against widget CSS.
  if (opts.extraSheets?.length) {
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, ...opts.extraSheets];
  }

  // render() creates a fresh reactive root. Context does NOT cross from the
  // outer tree, so WidgetCtx is re-provided here; likewise the outer tree's
  // ErrorBoundary cannot see errors thrown inside this root, so the crash
  // boundary must live inside it.
  const dispose = render(
    () =>
      createComponent(WidgetCtx.Provider, {
        value: opts.ctx,
        get children() {
          return createComponent(ErrorBoundary, {
            fallback: (err: unknown) => {
              const error = err instanceof Error ? err : new Error(String(err));
              // Deferred: onCrash typically unmounts the host and disposes this
              // root; doing that synchronously would dispose the root while it
              // is still computing the fallback.
              queueMicrotask(() => opts.onCrash(error));
              return null;
            },
            get children() {
              return createComponent(opts.definition.component, {
                get config() {
                  return opts.config();
                },
              });
            },
          });
        },
      }),
    shadow,
  );

  return {
    dispose: () => {
      stopClassSync();
      dispose();
    },
  };
}
