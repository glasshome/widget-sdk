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

type Page = Parameters<BrowserCommand<[]>>[0]["page"];
type Cdp = Awaited<ReturnType<ReturnType<Page["context"]>["newCDPSession"]>>;
// Chromium tracks the fingers down per session, so one finger's touchStart and its later moves share it.
const sessions = new WeakMap<Page, Promise<Cdp>>();
function touchSession(page: Page) {
  let session = sessions.get(page);
  if (!session) {
    session = page
      .context()
      .newCDPSession(page)
      .then(async (cdp) => {
        await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
        return cdp;
      });
    sessions.set(page, session);
  }
  return session;
}

export type TouchAction = "touchStart" | "touchMove" | "touchEnd";

/** Real touch input: every finger still down, in the test frame's viewport. */
export const touch: BrowserCommand<
  [action: TouchAction, points: { x: number; y: number }[]]
> = async (ctx, action, points) => {
  const frame = await ctx.frame();
  const box = await (await frame.frameElement()).boundingBox();
  if (!box) throw new Error("the test frame has no box");
  const scale = box.width / (await frame.evaluate(() => innerWidth));
  const cdp = await touchSession(ctx.page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: action,
    touchPoints: points.map((p, id) => ({ x: box.x + p.x * scale, y: box.y + p.y * scale, id })),
  });
};
