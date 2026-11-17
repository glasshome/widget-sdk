import { describe, expect, test } from "bun:test";
import { uncoveredReleases } from "./export-names";

const published = ["0.9.0", "1.0.0", "1.1.0", "1.2.0", "1.3.0-beta.1", "1.3.0", "1.4.0", "2.0.0"];

describe("uncoveredReleases", () => {
  test("names the stable releases below the build that the history lacks, oldest first", () => {
    expect(uncoveredReleases({ "1.1.0": ["Widget"] }, [...published].reverse(), "1.4.0")).toEqual([
      "1.0.0",
      "1.2.0",
      "1.3.0",
    ]);
  });

  test("a history covering every release below the build has none", () => {
    const history = { "1.0.0": [], "1.1.0": [], "1.2.0": [], "1.3.0": [] };
    expect(uncoveredReleases(history, published, "1.4.0")).toEqual([]);
  });

  test("ignores the build itself, newer releases, prereleases and 0.x", () => {
    expect(uncoveredReleases({}, published, "1.1.0")).toEqual(["1.0.0"]);
  });
});
