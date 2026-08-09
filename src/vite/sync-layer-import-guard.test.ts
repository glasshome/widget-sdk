import { describe, expect, test } from "bun:test";
import { isDirectSyncLayerImportSource } from "./index";

describe("isDirectSyncLayerImportSource", () => {
  test("flags widget source importing @glasshome/sync-layer (barrel and subpaths)", () => {
    expect(
      isDirectSyncLayerImportSource(
        "/repo/src/light/index.tsx",
        'import { useEntity } from "@glasshome/sync-layer/solid";',
      ),
    ).toBe(true);
    expect(
      isDirectSyncLayerImportSource(
        "/repo/src/light/index.tsx",
        "import { state } from '@glasshome/sync-layer'",
      ),
    ).toBe(true);
    // Multi-line import: only the closing line carries `from`.
    expect(
      isDirectSyncLayerImportSource(
        "/repo/src/common/store.ts",
        'import {\n  useEntity,\n  useService,\n} from "@glasshome/sync-layer/solid";\n',
      ),
    ).toBe(true);
  });

  test("ignores SDK imports and lookalike specifiers", () => {
    expect(
      isDirectSyncLayerImportSource(
        "/repo/src/light/index.tsx",
        'import { useEntity } from "@glasshome/widget-sdk";',
      ),
    ).toBe(false);
    expect(
      isDirectSyncLayerImportSource(
        "/repo/src/light/index.tsx",
        'import { x } from "@glasshome/sync-layer-extras";',
      ),
    ).toBe(false);
  });

  test("ignores dependencies and non-script assets", () => {
    const code = 'import { useEntity } from "@glasshome/sync-layer/solid";';
    expect(isDirectSyncLayerImportSource("/repo/node_modules/@glasshome/x/dist/i.js", code)).toBe(
      false,
    );
    expect(isDirectSyncLayerImportSource("/repo/src/light/widget.css", code)).toBe(false);
  });
});
