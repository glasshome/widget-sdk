import { render, screen } from "@solidjs/testing-library";
import { NumberField } from "@glasshome/ui/solid";
import { useFakeTime } from "@glasshome/ui/testing";
import type { BundledCatalog, CompiledCatalog } from "@glasshome/widget-contract/i18n-format";
import type { StateTexts } from "@glasshome/widget-contract/state-texts";
import { type Accessor, createSignal, type JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import { defineWidget } from "../../src/define-widget";
import { type ReactiveWidgetContext, WidgetCtx } from "../../src/framework/hooks";
import { t, translateState, useTranslation, type WidgetI18n } from "../../src/framework/i18n";

const messages: BundledCatalog = {
  v: 1,
  messages: {
    greeting: ["Hello ", { arg: "name" }],
    rooms: [
      {
        plural: "n",
        branches: { one: [{ pound: true }, " room"], other: [{ pound: true }, " rooms"] },
      },
    ],
  },
};

const manifest = {
  name: "i18n-probe",
  minSize: { w: 1, h: 1 },
  maxSize: { w: 2, h: 2 },
  sdkVersion: "^1.34.0",
};

const i18nFor = (
  language: string,
  catalog: CompiledCatalog | null,
  more: Partial<WidgetI18n> = {},
) =>
  ({
    language,
    formatting: `${language}-${language.toUpperCase()}`,
    catalog,
    sdk: null,
    ui: null,
    states: null,
    ...more,
  }) satisfies WidgetI18n;

type WidgetComponent = (props: { config: Record<string, unknown> }) => JSX.Element;

function mount(component: WidgetComponent, i18n?: Accessor<WidgetI18n | undefined>) {
  const ctx: ReactiveWidgetContext = {
    updateConfig: () => {},
    dimensions: () => ({ width: 0, height: 0 }),
    i18n,
  };
  const Component = component;
  return (
    <WidgetCtx.Provider value={ctx}>
      <Component config={{}} />
    </WidgetCtx.Provider>
  );
}

const probe = (Body: () => JSX.Element) =>
  defineWidget({ manifest: { ...manifest }, messages, component: () => <Body /> });

describe("a widget's own words", () => {
  it("speaks the member's catalog", () => {
    const widget = probe(() => <p>{t("greeting", { name: "Ana" })}</p>);
    render(() =>
      mount(widget.component, () => i18nFor("fr", { greeting: ["Bonjour ", { arg: "name" }] })),
    );
    expect(screen.getByText("Bonjour Ana")).toBeTruthy();
  });

  it("falls back to its bundled English for a key the catalog lacks", () => {
    const widget = probe(() => <p>{t("rooms", { n: 2 })}</p>);
    render(() => mount(widget.component, () => i18nFor("fr", { greeting: ["Bonjour"] })));
    expect(screen.getByText("2 rooms")).toBeTruthy();
  });

  it("shows the key when no catalog has it", () => {
    const widget = probe(() => <p>{t("missing.key")}</p>);
    render(() => mount(widget.component, () => i18nFor("fr", {})));
    expect(screen.getByText("missing.key")).toBeTruthy();
  });

  it("keys each instance to its own language", () => {
    const widget = probe(() => <p>{t("greeting", { name: "Ana" })}</p>);
    render(() => (
      <>
        {mount(widget.component, () => i18nFor("fr", { greeting: ["Bonjour ", { arg: "name" }] }))}
        {mount(widget.component, () => i18nFor("de", { greeting: ["Hallo ", { arg: "name" }] }))}
      </>
    ));
    expect(screen.getByText("Bonjour Ana")).toBeTruthy();
    expect(screen.getByText("Hallo Ana")).toBeTruthy();
  });

  it("speaks English from its messages on a host that sends no i18n", () => {
    const widget = probe(() => <p>{t("greeting", { name: "Ana" })}</p>);
    render(() => mount(widget.component));
    expect(screen.getByText("Hello Ana")).toBeTruthy();
  });

  it("gives the language its catalog resolved to", () => {
    let language: Accessor<string> = () => "";
    const widget = probe(() => {
      language = useTranslation().language;
      return <p>probe</p>;
    });
    render(() => mount(widget.component, () => i18nFor("fr", null)));
    expect(language()).toBe("en");
  });
});

describe("ui inside a widget", () => {
  it("speaks the ui catalog in hand on the first frame", () => {
    useFakeTime();
    const widget = probe(() => <NumberField value={21} step={1} />);
    const ui: CompiledCatalog = { "ui.number-field.increment": ["Augmenter"] };
    render(() => mount(widget.component, () => i18nFor("fr", {}, { ui })));
    expect(screen.getByRole("button", { name: "Augmenter" })).toBeTruthy();
  });
});

describe("translateState", () => {
  it("shows the raw state until the state texts arrive, then the member's words", () => {
    const states: StateTexts = {
      component: { climate: { _: { heat_cool: "Chauffage/climatisation" } } },
      entity: {},
    };
    const [i18n, setI18n] = createSignal<WidgetI18n>(i18nFor("fr", {}));
    const entity = {
      domain: "climate",
      state: "heat_cool",
      platform: "generic_thermostat",
      attributes: {},
    };
    const widget = probe(() => <p data-testid="state">{translateState(entity)}</p>);
    render(() => mount(widget.component, i18n));
    expect(screen.getByTestId("state").textContent).toBe("heat_cool");
    setI18n(i18nFor("fr", {}, { states }));
    expect(screen.getByTestId("state").textContent).toBe("Chauffage/climatisation");
  });
});
