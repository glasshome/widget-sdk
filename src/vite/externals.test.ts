import { describe, expect, test } from "bun:test";
import { HOST_PROVIDED_MODULES } from "@glasshome/widget-contract";
import { isWidgetExternal } from "./index";

describe("isWidgetExternal — parity with the host import map", () => {
  test("every host-provided module is external", () => {
    for (const id of HOST_PROVIDED_MODULES) {
      expect(isWidgetExternal(id)).toBe(true);
    }
  });

  test("specifiers the import map does not serve get bundled", () => {
    // Externalizing these shipped builds that 404'd at mount time.
    expect(isWidgetExternal("@glasshome/ui")).toBe(false);
    expect(isWidgetExternal("@glasshome/ui/tokens")).toBe(false);
  });
});
