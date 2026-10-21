import { commands } from "vitest/browser";
import type { MouseAction } from "./commands";

declare module "vitest/browser" {
  interface BrowserCommands {
    mouse(action: MouseAction, x: number, y: number): Promise<void>;
  }
}

/** A point inside `el`, `at` of the way across and down; its centre by default. */
function point(el: Element, at = { x: 0.5, y: 0.5 }) {
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width * at.x, y: r.y + r.height * at.y };
}

export function mouseOn(action: MouseAction, el: Element, at?: { x: number; y: number }) {
  const { x, y } = point(el, at);
  return commands.mouse(action, x, y);
}

export const mouseAt = (action: MouseAction, x: number, y: number) => commands.mouse(action, x, y);
