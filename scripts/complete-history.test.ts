import { describe, expect, test } from "bun:test";
import { deriveFloor } from "@glasshome/widget-contract/sdk-floor";
import { completeHistory } from "./export-names";

const committed = { "1.22.0": ["Widget"], "1.23.1": ["Widget"] };
const releases = ["1.23.1", "1.24.0", "1.25.0", "1.25.1", "1.26.0"];
const published: Record<string, string[]> = {
  "1.24.0": ["Widget"],
  "1.25.0": ["Widget", "useThing"],
  "1.25.1": ["Widget", "useThing"],
};
const build = ["Widget", "useThing", "useOther"];

describe("completeHistory", () => {
  test("a name added after the committed history floors at the release that added it", () => {
    const history = completeHistory({
      committed,
      releases,
      own: "1.26.0",
      scan: (v) => published[v] ?? null,
    });
    const complete = { ...history, "1.26.0": build };
    const code = `import{Widget as a,useThing as b}from"@glasshome/widget-sdk";`;
    expect(deriveFloor({ code, history: complete, buildSdk: "1.26.0", releases })).toEqual({
      floor: "1.25.0",
      reason: "derived",
    });
  });

  test("reads only the releases the committed history skips", () => {
    const asked: string[] = [];
    completeHistory({
      committed: { ...committed, "1.24.0": ["Widget"] },
      releases,
      own: "1.26.0",
      scan: (v) => {
        asked.push(v);
        return published[v] ?? null;
      },
    });
    expect(asked).toEqual(["1.25.0", "1.25.1"]);
  });

  test("a complete history reads nothing", () => {
    const history = completeHistory({
      committed: { ...committed, ...published },
      releases,
      own: "1.26.0",
      scan: () => {
        throw new Error("no registry read expected");
      },
    });
    expect(Object.keys(history)).toEqual(["1.22.0", "1.23.1", "1.24.0", "1.25.0", "1.25.1"]);
  });

  test("a release whose exports cannot be scanned fails the build", () => {
    expect(() => completeHistory({ committed, releases, own: "1.26.0", scan: () => null })).toThrow(
      "export history lacks 1.24.0 and its exports cannot be scanned",
    );
  });

  test("an unreachable registry fails the build and names the release", () => {
    expect(() =>
      completeHistory({
        committed,
        releases,
        own: "1.26.0",
        scan: () => {
          throw new Error("getaddrinfo ENOTFOUND registry.npmjs.org");
        },
      }),
    ).toThrow(
      "export history lacks 1.24.0 and the registry could not supply it: getaddrinfo ENOTFOUND registry.npmjs.org",
    );
  });
});
