import { render, screen } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import { type ReactiveWidgetContext, WidgetCtx } from "../../src/framework/hooks";
import { asset } from "../../src/framework/i18n";

const BASE = "/widget-files/hub/ana/fan/1.2.0/files/";

function inWidget(body: () => JSX.Element, assetBase?: () => string | null) {
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
    assetBase,
  };
  return render(() => <WidgetCtx.Provider value={ctx}>{body()}</WidgetCtx.Provider>);
}

const outcome = (name: string) => {
  try {
    return String(asset(name));
  } catch (error) {
    return `threw ${error instanceof Error ? error.name : "?"}`;
  }
};

describe("asset", () => {
  it("is the widget's own file under the base the host lends", () => {
    inWidget(
      () => <p>{outcome("hero.png")}</p>,
      () => BASE,
    );
    expect(screen.getByText(`${BASE}hero.png`)).toBeTruthy();
  });

  it("throws for a name outside the file grammar", () => {
    inWidget(
      () => (
        <ul>
          <li>{outcome("../x.png")}</li>
          <li>{outcome("Hero.PNG")}</li>
          <li>{outcome("hero.svg")}</li>
          <li>{outcome("files/hero.png")}</li>
        </ul>
      ),
      () => BASE,
    );
    expect(screen.getAllByText("threw TypeError")).toHaveLength(4);
  });

  it("is null on a host that lends no base", () => {
    inWidget(
      () => (
        <ul>
          <li>{outcome("hero.png")}</li>
        </ul>
      ),
      () => null,
    );
    inWidget(() => <p>{outcome("glow.webp")}</p>);
    expect(screen.getAllByText("null")).toHaveLength(2);
  });

  it("throws outside a widget", () => {
    render(() => <p>{outcome("hero.png")}</p>);
    expect(screen.getByText("threw Error")).toBeTruthy();
  });
});
