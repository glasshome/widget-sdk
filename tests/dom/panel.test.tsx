import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
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

  it("snaps a drag to the slide's step", async () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(() => (
      <PanelRow
        icon="mdi:thermostat"
        name="Thermostat"
        on
        slide={{ value: 20, min: 10, max: 30, step: 0.5, onChange, onCommit }}
      />
    ));

    await press(screen.getByRole("slider", { name: "Thermostat" }), 0.5, 0.774);

    expect(onChange.mock.calls.every(([v]) => Number.isInteger(v * 2))).toBe(true);
    expect(onCommit).toHaveBeenCalledWith(25.5);
  });

  it("moves one step per arrow key and names its value", async () => {
    const onCommit = vi.fn();
    render(() => (
      <PanelRow
        icon="mdi:thermostat"
        name="Thermostat"
        state="Heat · 21°"
        on
        slide={{
          value: 21,
          min: 7,
          max: 35,
          step: 0.5,
          label: "Target",
          onChange: () => {},
          onCommit,
        }}
      />
    ));
    const slider = screen.getByRole("slider", { name: "Thermostat, Target" });

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");

    expect(onCommit).toHaveBeenCalledWith(21.5);
    expect(slider.getAttribute("aria-valuenow")).toBe("21");
    expect(slider.getAttribute("aria-valuetext")).toBe("Heat · 21°");
  });

  it("is not a button when there is nothing to press", () => {
    render(() => <PanelRow icon="mdi:battery" name="Door lock" on fill={40} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Door lock")).toBeTruthy();
  });
});
