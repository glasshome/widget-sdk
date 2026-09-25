import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { PanelRow, WidgetPanel } from "../../src/framework/panel/panel";

const box = { left: 0, top: 0, width: 200, height: 56, right: 200, bottom: 56, x: 0, y: 0 };

function press(el: HTMLElement, from: number, to = from) {
  el.getBoundingClientRect = () => ({ ...box, toJSON: () => box }) as DOMRect;
  el.setPointerCapture = () => {};
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: from, clientY: 20 });
  if (to !== from) fireEvent.pointerMove(el, { pointerId: 1, clientX: to, clientY: 20 });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: to, clientY: 20 });
}

describe("PanelRow", () => {
  it("taps once on a short press", () => {
    const onTap = vi.fn();
    render(() => <PanelRow icon="mdi:lightbulb" name="Ceiling" on={false} onTap={onTap} />);

    press(screen.getByRole("button", { name: /Ceiling/ }), 50);

    expect(onTap).toHaveBeenCalledOnce();
  });

  it("sets the level from where a drag across it ends, and does not tap", () => {
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

    press(screen.getByRole("button", { name: /Ceiling/ }), 20, 150);

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

describe("WidgetPanel", () => {
  it("gives the stage value a keyboard handle", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(() => (
      <WidgetPanel
        icon="mdi:lightbulb"
        name="Lamp"
        slide={{ value: 40, label: "Brightness", onChange, onCommit }}
      />
    ));

    const handle = screen.getByRole("slider", { name: "Brightness" }) as HTMLInputElement;
    handle.value = "45";
    fireEvent.input(handle);
    fireEvent.change(handle);

    expect(onChange).toHaveBeenCalledWith(45);
    expect(onCommit).toHaveBeenCalledWith(45);
  });

  it("leaves a press on a control inside the stage to that control", () => {
    const onChange = vi.fn();
    render(() => (
      <WidgetPanel
        icon="mdi:lightbulb"
        name="Lamp"
        slide={{ value: 40, onChange }}
        actions={<button type="button">All off</button>}
      />
    ));

    const button = screen.getByRole("button", { name: "All off" });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 10, clientY: 200 });

    expect(onChange).not.toHaveBeenCalled();
  });
});
