import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { PanelRow } from "../../src/framework/panel/panel";
import { mouseOn } from "./harness/press";

/** Presses at `from` of the row's width and lets go at `to`, once the row has finished its press feedback. */
async function press(el: HTMLElement, from: number, to = from) {
  await mouseOn("down", el, { x: from, y: 0.5 });
  await Promise.allSettled(el.getAnimations().map((animation) => animation.finished));
  if (to !== from) await mouseOn("move", el, { x: to, y: 0.5 });
  await mouseOn("up", el, { x: to, y: 0.5 });
}

describe("PanelRow", () => {
  it("taps once on a short press", async () => {
    const onTap = vi.fn();
    render(() => <PanelRow icon="mdi:lightbulb" name="Ceiling" on={false} onTap={onTap} />);

    await press(screen.getByRole("button", { name: /Ceiling/ }), 0.25);

    expect(onTap).toHaveBeenCalledOnce();
  });

  it("sets the level from where a drag across it ends, and does not tap", async () => {
    const onTap = vi.fn();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(() => (
      <PanelRow
        icon="mdi:lightbulb"
        name="Ceiling"
        on
        onTap={onTap}
        slide={{ value: 10, onChange, onCommit }}
      />
    ));

    await press(screen.getByRole("button", { name: /Ceiling/ }), 0.1, 0.75);

    expect(onChange).toHaveBeenLastCalledWith(75);
    expect(onCommit).toHaveBeenCalledWith(75);
    expect(onTap).not.toHaveBeenCalled();
  });

  it("is not a button when there is nothing to press", () => {
    render(() => <PanelRow icon="mdi:battery" name="Door lock" on fill={40} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Door lock")).toBeTruthy();
  });
});
