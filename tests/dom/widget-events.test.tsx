/**
 * A widget renders in a closed shadow root, where Solid's document-level
 * delegation cannot see; every ui control gets its handler through props, which
 * Solid delegates. Only a real browser hides a closed root's nodes from
 * composedPath(), so only real input here can tell a dead or doubled tap.
 */

import { render } from "@solidjs/testing-library";
import { Portal } from "solid-js/web";
import { describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { instantiateWidget } from "../../src/host";
import type { WidgetDefinition } from "../../src/types";
import { Button } from "../../src/ui";
import { mouseAt, mouseOn } from "./harness/press";

const WATCHED = [
  "click",
  "pointerdown",
  "pointerup",
  "pointerover",
  "mousedown",
  "focusin",
  "keydown",
  "keyup",
  "focusout",
];

const inside = (n: EventTarget | null) => n instanceof Node && n.getRootNode() !== document;

function mountWidget() {
  const counts = { widget: 0, page: 0, leaks: 0, seen: 0, overlay: 0, overlayLeaks: 0 };
  const parts: { button?: HTMLButtonElement; overlay?: HTMLButtonElement } = {};
  const definition: WidgetDefinition = {
    manifest: {
      name: "events",
      minSize: { w: 1, h: 1 },
      maxSize: { w: 1, h: 1 },
      sdkVersion: "^1.0.0",
    },
    component: () => (
      <>
        <Button
          ref={(el: HTMLButtonElement) => (parts.button = el)}
          onClick={() => counts.widget++}
        >
          Tap
        </Button>
        <div onClick={(e) => e.stopPropagation()}>
          <Portal>
            <button
              type="button"
              ref={(el) => (parts.overlay = el)}
              onClick={() => counts.overlay++}
            >
              Overlay
            </button>
          </Portal>
        </div>
      </>
    ),
  };
  const stop = new AbortController();
  onTestFinished(() => stop.abort());
  for (const name of WATCHED) {
    window.addEventListener(
      name,
      (e) => {
        counts.seen++;
        if (inside(e.target) || inside(e.currentTarget)) counts.leaks++;
      },
      { signal: stop.signal },
    );
  }
  document.addEventListener(
    "click",
    (e) => {
      if (inside(e.target) || inside(e.currentTarget)) counts.overlayLeaks++;
    },
    { signal: stop.signal },
  );
  const host = document.createElement("div");
  render(() => <div onClick={() => counts.page++}>{host}</div>);
  const widget = instantiateWidget(host, {
    definition,
    config: () => ({}),
    ctx: { updateConfig: () => undefined, dimensions: () => ({ width: 0, height: 0 }) },
    cssText: null,
    onCrash: (err) => {
      throw err;
    },
  });
  onTestFinished(() => widget.dispose());
  const part = (name: keyof typeof parts) => {
    const el = parts[name];
    if (!el) throw new Error(`${name} did not render`);
    return el;
  };
  return { counts, part };
}

describe("a widget's events", () => {
  it("a ui button inside a widget fires once per tap, and the page sees only the widget host", async () => {
    const { counts, part } = mountWidget();

    await mouseOn("click", part("button"));
    await userEvent.keyboard("a");
    await mouseAt("click", innerWidth - 1, innerHeight - 1);

    expect(counts).toMatchObject({ widget: 1, page: 1, leaks: 0 });
    expect(counts.seen).toBeGreaterThanOrEqual(9);
  });

  it("a widget overlay portalled to the body leaves no inner node on the page's event", async () => {
    const { counts, part } = mountWidget();

    await mouseOn("click", part("overlay"));

    expect(counts).toMatchObject({ overlay: 1, overlayLeaks: 0 });
  });
});
