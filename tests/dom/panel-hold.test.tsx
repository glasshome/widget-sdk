import { HOLD_MS } from "@glasshome/ui/solid";
import { useFakeTime } from "@glasshome/ui/testing";
import { render, screen } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import "../../src/framework/theming/tokens.css";
import { PanelRow } from "../../src/framework/panel/panel";
import { mouseOn } from "./harness/press";

describe("PanelRow hold", () => {
  it("holds with the handler it has now, given after the row mounted", async () => {
    useFakeTime();
    const onTap = vi.fn();
    const onHold = vi.fn();
    const [hold, setHold] = createSignal<{ run: () => void }>();
    render(() => (
      <PanelRow icon="mdi:lightbulb" name="Ceiling" on={false} onTap={onTap} onHold={hold()?.run} />
    ));
    setHold({ run: onHold });
    flush();
    const row = screen.getByRole("button", { name: /Ceiling/ });

    await mouseOn("down", row);
    await vi.advanceTimersByTimeAsync(HOLD_MS);
    await mouseOn("up", row);

    expect(onHold).toHaveBeenCalledOnce();
    expect(onTap).not.toHaveBeenCalled();
  });
});
