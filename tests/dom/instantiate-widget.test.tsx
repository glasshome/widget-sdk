import {
  type ReactiveWidgetContext,
  useWidgetContext,
  type WidgetDefinition,
} from "@glasshome/widget-sdk";
import { createEffect, createSignal } from "solid-js";
import { describe, expect, test } from "vitest";
import { instantiateWidget } from "../../src/host";

function makeDefinition(component: WidgetDefinition["component"]): WidgetDefinition {
  return {
    manifest: {
      name: "test-widget",
      minSize: { w: 1, h: 1 },
      maxSize: { w: 4, h: 4 },
      sdkVersion: "^1.0.0",
    },
    component,
  };
}

function makeCtx(): ReactiveWidgetContext {
  return {
    updateConfig: () => undefined,
    dimensions: () => ({ width: 0, height: 0 }),
  };
}

function makeHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

describe("instantiateWidget", () => {
  test("mounts into a closed shadow root and re-provides the host ctx", () => {
    const host = makeHost();
    const ctx = makeCtx();
    let seenCtx: ReactiveWidgetContext | undefined;
    let el: HTMLElement | undefined;

    const handle = instantiateWidget(host, {
      definition: makeDefinition(() => {
        seenCtx = useWidgetContext();
        el = document.createElement("div");
        return el;
      }),
      config: () => ({}),
      ctx,
      cssText: null,
      onCrash: () => undefined,
    });

    // Closed mode: the shadow root is unreachable from the host element.
    expect(host.shadowRoot).toBeNull();
    // The component ran inside the new root and got the re-provided ctx.
    expect(seenCtx).toBe(ctx);
    const mounted = el;
    if (!mounted) throw new Error("widget did not mount");
    const root = mounted.getRootNode();
    expect(root).toBeInstanceOf(ShadowRoot);
    if (!(root instanceof ShadowRoot)) throw new Error("unreachable");
    expect(root.host).toBe(host);
    expect(mounted.isConnected).toBe(true);

    handle.dispose();
    host.remove();
  });

  test("adopts tokens + the widget stylesheet; instances share one sheet", () => {
    const cssText = ".glasshome-test { color: red; }";
    const roots: ShadowRoot[] = [];

    const mount = () => {
      const host = makeHost();
      let el: HTMLElement | undefined;
      const handle = instantiateWidget(host, {
        definition: makeDefinition(() => {
          el = document.createElement("div");
          return el;
        }),
        config: () => ({}),
        ctx: makeCtx(),
        cssText,
        onCrash: () => undefined,
      });
      const root = el?.getRootNode();
      if (!(root instanceof ShadowRoot)) throw new Error("widget did not mount");
      roots.push(root);
      return handle;
    };

    const h1 = mount();
    const h2 = mount();
    const [rootA, rootB] = roots;
    if (!rootA || !rootB) throw new Error("expected two shadow roots");

    // Sheet 0 = SDK tokens (always adopted), sheet 1 = widget css. No override
    // sheet: that is a host-supplied extraSheet, not part of the default mount.
    expect(rootA.adoptedStyleSheets.length).toBe(2);
    expect(rootA.adoptedStyleSheets[1]).toBeInstanceOf(CSSStyleSheet);
    // Same cssText source: one shared constructed sheet, not one per instance.
    expect(rootB.adoptedStyleSheets[1]).toBe(rootA.adoptedStyleSheets[1]);
    // Tokens sheet is the same singleton across roots too.
    expect(rootB.adoptedStyleSheets[0]).toBe(rootA.adoptedStyleSheets[0]);

    h1.dispose();
    h2.dispose();
  });

  test("only the tokens sheet is adopted when cssText is null", () => {
    const host = makeHost();
    let el: HTMLElement | undefined;
    const handle = instantiateWidget(host, {
      definition: makeDefinition(() => {
        el = document.createElement("div");
        return el;
      }),
      config: () => ({}),
      ctx: makeCtx(),
      cssText: null,
      onCrash: () => undefined,
    });
    const root = el?.getRootNode();
    if (!(root instanceof ShadowRoot)) throw new Error("widget did not mount");
    expect(root.adoptedStyleSheets.length).toBe(1);
    handle.dispose();
  });

  test("extraSheets are adopted last so their !important rules win", () => {
    const cssText = ".glasshome-test { color: red; }";
    const override = new CSSStyleSheet();
    override.replaceSync(":host(.x) * { color: blue !important; }");
    const host = makeHost();
    let el: HTMLElement | undefined;
    const handle = instantiateWidget(host, {
      definition: makeDefinition(() => {
        el = document.createElement("div");
        return el;
      }),
      config: () => ({}),
      ctx: makeCtx(),
      cssText,
      onCrash: () => undefined,
      extraSheets: [override],
    });
    const root = el?.getRootNode();
    if (!(root instanceof ShadowRoot)) throw new Error("widget did not mount");
    // tokens (0), widget css (1), override (2, last).
    expect(root.adoptedStyleSheets.length).toBe(3);
    expect(root.adoptedStyleSheets[2]).toBe(override);
    handle.dispose();
  });

  test("mirrorClasses default to dark; custom classes mirror onto the host", () => {
    document.documentElement.classList.add("dark", "perf-blur");
    try {
      const hostDefault = makeHost();
      const h1 = instantiateWidget(hostDefault, {
        definition: makeDefinition(() => document.createElement("div")),
        config: () => ({}),
        ctx: makeCtx(),
        cssText: null,
        onCrash: () => undefined,
      });
      // Default mirrors only `dark`, never a host's private classes.
      expect(hostDefault.classList.contains("dark")).toBe(true);
      expect(hostDefault.classList.contains("perf-blur")).toBe(false);

      const hostCustom = makeHost();
      const h2 = instantiateWidget(hostCustom, {
        definition: makeDefinition(() => document.createElement("div")),
        config: () => ({}),
        ctx: makeCtx(),
        cssText: null,
        onCrash: () => undefined,
        mirrorClasses: ["dark", "perf-blur"],
      });
      expect(hostCustom.classList.contains("dark")).toBe(true);
      expect(hostCustom.classList.contains("perf-blur")).toBe(true);

      h1.dispose();
      h2.dispose();
    } finally {
      document.documentElement.classList.remove("dark", "perf-blur");
    }
  });

  test("dispose() unmounts the widget tree", () => {
    const host = makeHost();
    let el: HTMLElement | undefined;
    const handle = instantiateWidget(host, {
      definition: makeDefinition(() => {
        el = document.createElement("div");
        return el;
      }),
      config: () => ({}),
      ctx: makeCtx(),
      cssText: null,
      onCrash: () => undefined,
    });
    const mounted = el;
    if (!mounted) throw new Error("widget did not mount");
    expect(mounted.isConnected).toBe(true);
    handle.dispose();
    expect(mounted.isConnected).toBe(false);
  });

  test("onCrash fires when the widget throws during render", async () => {
    const host = makeHost();
    let crash: Error | undefined;
    instantiateWidget(host, {
      definition: makeDefinition(() => {
        throw new Error("boom");
      }),
      config: () => ({}),
      ctx: makeCtx(),
      cssText: null,
      onCrash: (error) => {
        crash = error;
      },
    });
    // onCrash is deferred a microtask so the host can dispose safely.
    await Promise.resolve();
    expect(crash?.message).toBe("boom");
  });

  test("config changes propagate reactively across the render boundary", () => {
    const [config, setConfig] = createSignal<Record<string, unknown>>({ label: "first" });
    const host = makeHost();
    let el: HTMLElement | undefined;
    const handle = instantiateWidget(host, {
      definition: makeDefinition((props) => {
        const div = document.createElement("div");
        createEffect(() => {
          div.textContent = String(props.config.label);
        });
        el = div;
        return div;
      }),
      config,
      ctx: makeCtx(),
      cssText: null,
      onCrash: () => undefined,
    });
    const mounted = el;
    if (!mounted) throw new Error("widget did not mount");
    expect(mounted.textContent).toBe("first");
    setConfig({ label: "second" });
    expect(mounted.textContent).toBe("second");
    handle.dispose();
  });
});
