import { FILE_PATH } from "@glasshome/widget-contract/sidecars";
import { useContext } from "solid-js";
import { WidgetCtx } from "../hooks/use-widget-context";

/**
 * The URL of `name`, one of this widget's own files, such as `asset("hero.png")`; null on a host that serves none.
 * For sources set from script (`<img src>`, `style.backgroundImage`); a widget stylesheet's `url()` cannot reach these files.
 * Reads the widget it runs in, so call it while rendering.
 */
export function asset(name: string): string | null {
  const ctx = useContext(WidgetCtx);
  if (!ctx) throw new Error("asset() must run inside a widget");
  if (!FILE_PATH.test(`files/${name}`)) {
    throw new TypeError(
      `asset("${name}"): a file name is lowercase letters, digits and dashes ending in .png, .jpg or .webp`,
    );
  }
  const base = ctx.assetBase?.() ?? null;
  return base === null ? null : `${base}${name}`;
}
