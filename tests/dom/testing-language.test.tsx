import { compileCatalogSource } from "@glasshome/widget-contract/catalog-build";
import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { useTranslation } from "../../src/framework/i18n";
import { languageTools, WidgetLanguage } from "../../src/testing";

const catalog = compileCatalogSource('{ "a": "un" }', "fr.json");
const english = compileCatalogSource('{ "a": "one", "b": "two" }', "en.json");

function Both() {
  const { t } = useTranslation();
  return (
    <p>
      {t("a")} {t("b")}
    </p>
  );
}

describe("the language harness", () => {
  it("WidgetLanguage gives t the catalog over the bundled English", () => {
    render(() => (
      <WidgetLanguage language="fr" formatting="fr-FR" catalog={catalog} english={english}>
        <Both />
      </WidgetLanguage>
    ));
    expect(screen.getByText("un two")).toBeTruthy();
  });

  it("languageTools formats in the formatting locale", () => {
    const tools = languageTools({
      language: "de",
      formatting: "de-DE",
      catalog: null,
      english: null,
    });
    expect(tools.formatNumber(20.5)).toBe("20,5");
  });

  it("the built testing entry feeds the built root entry", async () => {
    const built = await import("../../dist/testing/index.js");
    const root = await import("../../dist/index.js");
    function Probe() {
      const { t } = root.useTranslation();
      return <p>{t("a")}</p>;
    }
    render(() => (
      <built.WidgetLanguage language="fr" formatting="fr-FR" catalog={catalog} english={english}>
        <Probe />
      </built.WidgetLanguage>
    ));
    expect(screen.getByText("un")).toBeTruthy();
  });
});
