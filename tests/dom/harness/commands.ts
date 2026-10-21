import type {} from "@vitest/browser-playwright";
import type { BrowserCommand } from "vitest/node";

export type MouseAction = "move" | "down" | "up" | "click";

/** Real mouse input at a point of the test frame's viewport, through the page that holds the frame. */
export const mouse: BrowserCommand<[action: MouseAction, x: number, y: number]> = async (
  ctx,
  action,
  x,
  y,
) => {
  const frame = await ctx.frame();
  const box = await (await frame.frameElement()).boundingBox();
  if (!box) throw new Error("the test frame has no box");
  const scale = box.width / (await frame.evaluate(() => innerWidth));
  const px = box.x + x * scale;
  const py = box.y + y * scale;
  if (action === "click") return ctx.page.mouse.click(px, py);
  await ctx.page.mouse.move(px, py);
  if (action === "down") await ctx.page.mouse.down();
  if (action === "up") await ctx.page.mouse.up();
};
