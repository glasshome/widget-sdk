/**
 * One corner for the whole widget: the shell, the content clip and the slider
 * fill all round on `--widget-radius`, which tracks the host theme's radius
 * scale. A fixed radius on the shell, or a square clip inside it, is the bleed
 * a household sees when it drags Border Radius.
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

function shell(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>(".glasshome-widget");
  if (!el) throw new Error("widget shell did not render");
  return el;
}

function ruleBody(selector: string): string {
  const start = tokensCss.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no rule for ${selector}`);
  return tokensCss.slice(start, tokensCss.indexOf("}", start));
}

function clipPaths(): string[] {
  return tokensCss
    .split("clip-path:")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf(";")).trim());
}

describe("widget radius", () => {
  it("rounds the shell on the token, not a fixed radius", () => {
    const { container } = render(() => <Widget />);
    expect(shell(container).className).toContain("rounded-[var(--widget-radius)]");
  });

  it("takes the token from the host theme's radius scale", () => {
    expect(ruleBody(".glasshome-widget")).toContain("--widget-radius: var(--radius-lg, 12px)");
  });

  it("clips the content layer on the same corner", () => {
    expect(ruleBody(".glasshome-widget-content")).toContain(
      "border-radius: var(--widget-radius)",
    );
  });

  it("rounds every slider fill clip, horizontal and vertical", () => {
    const clips = clipPaths();
    expect(clips.length).toBeGreaterThan(1);
    for (const clip of clips) expect(clip).toContain("round var(--widget-radius)");
  });
});
