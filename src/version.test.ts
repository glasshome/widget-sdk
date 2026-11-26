import { describe, expect, test } from "bun:test";
import pkg from "../package.json" with { type: "json" };
import { SDK_VERSION } from "./version";

describe("SDK_VERSION", () => {
  test("reports the major the package declares", () => {
    expect(Number(SDK_VERSION.split(".")[0])).toBe(pkg.glasshome.sdkMajor);
  });

  test("is the package version once the version reaches the declared major", () => {
    if (Number(pkg.version.split(".")[0]) >= pkg.glasshome.sdkMajor) {
      expect(SDK_VERSION).toBe(pkg.version);
    }
  });
});
