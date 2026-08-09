import { describe, expect, test } from "bun:test";
import { deprecations } from "../deprecations";
import { createUiImportTracker, isDirectUiImportSource } from "./index";

/** One widget build: scan its sources, then report what is new this run. */
function runBuild(warned: Set<string>, sources: [id: string, code: string][]): string[] {
  const tracker = createUiImportTracker(warned);
  for (const [id, code] of sources) tracker.scan(id, code);
  return tracker.take();
}

describe("isDirectUiImportSource", () => {
  test("flags widget source importing @glasshome/ui (barrel and subpaths)", () => {
    expect(
      isDirectUiImportSource(
        "/repo/src/light/controls.tsx",
        'import { Slider } from "@glasshome/ui/solid";',
      ),
    ).toBe(true);
    expect(
      isDirectUiImportSource("/repo/src/light/controls.tsx", "import { Badge } from '@glasshome/ui'"),
    ).toBe(true);
    // Multi-line import: only the closing line carries `from`.
    expect(
      isDirectUiImportSource(
        "/repo/src/common/widget-dialog-props.ts",
        'import {\n  Button,\n  SchemaForm,\n} from "@glasshome/ui/solid";\n',
      ),
    ).toBe(true);
  });

  test("ignores SDK imports and lookalike specifiers", () => {
    expect(
      isDirectUiImportSource(
        "/repo/src/light/controls.tsx",
        'import { Slider } from "@glasshome/widget-sdk";',
      ),
    ).toBe(false);
    expect(
      isDirectUiImportSource("/repo/src/light/controls.tsx", 'import { x } from "@glasshome/ui-kit";'),
    ).toBe(false);
  });

  test("ignores dependencies and the SDK's generated build entries", () => {
    const code = 'import { Slider } from "@glasshome/ui/solid";';
    expect(isDirectUiImportSource("/repo/node_modules/@glasshome/widgets/dist/x.js", code)).toBe(
      false,
    );
    // BUILD_CACHE_DIR lives under node_modules: the SDK's own generated entry stays silent.
    expect(
      isDirectUiImportSource("/repo/node_modules/.cache/glasshome-widgets/light.entry.ts", code),
    ).toBe(false);
    // Non-script assets (the generated Tailwind css) are not scanned.
    expect(isDirectUiImportSource("/repo/src/light/widget.css", code)).toBe(false);
  });
});

describe("uiImportGuard warning cadence", () => {
  const shared: [string, string] = [
    `${process.cwd()}/src/common/widget-dialog-props.ts`,
    'import { SchemaForm } from "@glasshome/ui/solid";',
  ];

  test("names a shared file once across a run, not once per widget build", () => {
    const warned = new Set<string>();
    const reports = Array.from({ length: 5 }, () => runBuild(warned, [shared]));

    expect(reports[0]).toEqual(["src/common/widget-dialog-props.ts"]);
    expect(reports.slice(1).every((r) => r.length === 0)).toBe(true);
  });

  test("still reports a file the run has not seen yet", () => {
    const warned = new Set<string>();
    runBuild(warned, [shared]);
    const second = runBuild(warned, [
      shared,
      [`${process.cwd()}/src/light/controls.tsx`, 'import { Slider } from "@glasshome/ui";'],
    ]);

    expect(second).toEqual(["src/light/controls.tsx"]);
  });

  test("stays silent when a build has no direct imports", () => {
    const report = runBuild(new Set(), [
      [`${process.cwd()}/src/light/index.tsx`, 'import { Widget } from "@glasshome/widget-sdk";'],
    ]);

    expect(report).toEqual([]);
  });
});

describe("direct-ui-import registry entry", () => {
  const entry = deprecations.find((d) => d.id === "direct-ui-import");

  test("is registered with a source pattern for the CLI lint", () => {
    expect(entry).toBeDefined();
    expect(entry?.removeIn).toBe("2.0.0");
    expect(entry?.sourcePattern).toBeDefined();
  });

  test("sourcePattern matches real import lines and spares SDK imports", () => {
    const re = new RegExp(entry?.sourcePattern ?? "");
    expect(re.test('import { Slider } from "@glasshome/ui/solid";')).toBe(true);
    expect(re.test('} from "@glasshome/ui/solid";')).toBe(true);
    expect(re.test("import { Badge } from '@glasshome/ui'")).toBe(true);
    expect(re.test('import { Slider } from "@glasshome/widget-sdk";')).toBe(false);
    expect(re.test('import { x } from "@glasshome/ui-kit";')).toBe(false);
  });
});
