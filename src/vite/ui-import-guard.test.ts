import { describe, expect, test } from "bun:test";
import { deprecations } from "../deprecations";
import { isDirectUiImportSource } from "./index";

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
