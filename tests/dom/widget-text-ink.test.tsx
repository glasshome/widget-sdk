/**
 * Widget label ink. A fixed alpha of the foreground is tuned against one mode
 * only: 60% of a pure-black light foreground lands far closer to the card than
 * 60% of a near-white dark one. The theme already tunes `--muted-foreground`
 * per mode, so the labels read it instead. The value and status lines keep the
 * full foreground; they carry the reading.
 *
 * The stylesheet is read from disk: vitest stubs CSS modules, and happy-dom
 * computes no cascade, so the shipped text is the only place this contract
 * exists at test time.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Widget } from "../../src/framework/core/Widget";

// happy-dom replaces the URL global, and node:fs rejects that class.
const here = dirname(fileURLToPath(import.meta.url));
const tokensCss = readFileSync(resolve(here, "../../src/framework/theming/tokens.css"), "utf-8");

function ruleBody(selector: string): string {
  const start = tokensCss.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no rule for ${selector}`);
  return tokensCss.slice(start, tokensCss.indexOf("}", start));
}

describe("widget text ink", () => {
  it("renders the title into the class the stylesheet inks", () => {
    const { container } = render(() => (
      <Widget>
        <Widget.Title>Living Room</Widget.Title>
      </Widget>
    ));
    expect(container.querySelector(".glasshome-widget-title")).toBeTruthy();
  });

  it("paints label and subtitle from the theme's muted ink, at full alpha", () => {
    for (const selector of [".glasshome-widget-title", ".glasshome-widget-subtitle"]) {
      const body = ruleBody(selector);
      expect(body).toContain("color: var(--color-muted-foreground, currentColor)");
      expect(body).not.toContain("color-mix");
    }
  });

  it("leaves the reading on the full foreground", () => {
    for (const selector of [".glasshome-widget-status", ".glasshome-widget-value"]) {
      expect(ruleBody(selector)).toContain("color: var(--color-foreground, currentColor)");
    }
  });
});
