import { useFakeTime } from "@glasshome/ui/testing";
import { render } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import {
  ENTITY_COMMAND_TIMEOUT_MS,
  type EntityCommand,
  useEntityCommand,
} from "../../src/framework/hooks/use-entity-command";

const STEP_MS = 50;

function mount(start: number, within = 0) {
  const [reported, setReported] = createSignal(start);
  const send = Promise.withResolvers<void>();
  const arrival = Promise.withResolvers<void>();
  const sent: number[] = [];
  let command!: EntityCommand<number>;
  function Probe() {
    command = useEntityCommand<number>({
      reported,
      send: (value) => {
        sent.push(value);
        arrival.resolve();
        return send.promise;
      },
      arrived: (now, target) => Math.abs(now - target) <= within,
    });
    return <span>{command.value()}</span>;
  }
  const view = render(() => <Probe />);
  const shown = () => Number(view.container.textContent);
  return { command: () => command, reported, setReported, send, arrival, sent, shown };
}

describe("an entity command", () => {
  it("shows the released value on the flush after release and never returns to the old one", async () => {
    useFakeTime();
    const m = mount(30);
    const seen: number[] = [];
    const sample = () => seen.push(m.shown());

    m.command().hold(40);
    flush();
    expect(m.shown()).toBe(40);
    m.command().hold(70);
    flush();
    expect(m.shown()).toBe(70);

    const done = m.command().run(70);
    flush();
    expect(m.shown()).toBe(70);
    expect(m.command().dragging()).toBe(false);
    await m.arrival.promise;

    m.send.resolve();
    for (let ms = 0; ms < 1_000; ms += STEP_MS) {
      await vi.advanceTimersByTimeAsync(STEP_MS);
      flush();
      sample();
    }
    expect(m.command().busy()).toBe(true);
    m.setReported(70);
    flush();
    expect(await done).toBe(true);
    flush();
    sample();

    expect(seen.every((v) => v === 70)).toBe(true);
    expect(m.shown()).toBe(70);
    expect(m.command().busy()).toBe(false);
    expect(m.sent).toEqual([70]);
  });

  it("shows the value when the write before the run shares its tick", async () => {
    useFakeTime();
    const m = mount(30);
    const [other, setOther] = createSignal(0);
    m.command().hold(70);
    setOther(1);
    void m.command().run(70);
    flush();
    expect(other()).toBe(1);
    expect(m.shown()).toBe(70);
  });

  it("puts the old value back when the send fails", async () => {
    useFakeTime();
    const m = mount(30);
    const done = m.command().run(70);
    flush();
    expect(m.shown()).toBe(70);
    await m.arrival.promise;
    m.send.reject(new Error("refused"));
    expect(await done).toBe(false);
    flush();
    expect(m.shown()).toBe(30);
    expect(m.command().busy()).toBe(false);
  });

  it("puts the old value back when the entity never reports it", async () => {
    useFakeTime();
    const m = mount(30);
    const done = m.command().run(70);
    flush();
    await m.arrival.promise;
    m.send.resolve();
    await vi.advanceTimersByTimeAsync(ENTITY_COMMAND_TIMEOUT_MS - 1);
    flush();
    expect(m.shown()).toBe(70);
    await vi.advanceTimersByTimeAsync(1);
    expect(await done).toBe(false);
    flush();
    expect(m.shown()).toBe(30);
    expect(m.command().busy()).toBe(false);
  });

  it("accepts a report within the device's own rounding", async () => {
    useFakeTime();
    const m = mount(30, 1);
    const done = m.command().run(70);
    flush();
    await m.arrival.promise;
    m.send.resolve();
    await vi.advanceTimersByTimeAsync(STEP_MS);
    m.setReported(69);
    flush();
    expect(await done).toBe(true);
    flush();
    expect(m.shown()).toBe(69);
  });

  it("keeps a new drag on screen when an earlier command settles under it", async () => {
    useFakeTime();
    const m = mount(30);
    const first = m.command().run(70);
    flush();
    await m.arrival.promise;
    m.command().hold(20);
    flush();
    m.send.resolve();
    m.setReported(70);
    flush();
    expect(await first).toBe(true);
    flush();
    expect(m.shown()).toBe(20);
  });
});

describe("a toggle command", () => {
  it("shows the new state on the next flush and keeps it busy until the entity reports", async () => {
    useFakeTime();
    const [on, setOn] = createSignal(false);
    const send = Promise.withResolvers<void>();
    let command!: EntityCommand<boolean>;
    function Probe() {
      command = useEntityCommand<boolean>({ reported: on, send: () => send.promise });
      return <span>{command.value() ? "on" : "off"}</span>;
    }
    const view = render(() => <Probe />);
    expect(view.container.textContent).toBe("off");

    const done = command.run(true);
    flush();
    expect(view.container.textContent).toBe("on");
    expect(command.busy()).toBe(true);

    send.resolve();
    await vi.advanceTimersByTimeAsync(STEP_MS);
    setOn(true);
    flush();
    expect(await done).toBe(true);
    flush();
    expect(view.container.textContent).toBe("on");
    expect(command.busy()).toBe(false);
  });

  it("is busy until the call returns when there is no value to show", async () => {
    useFakeTime();
    const send = Promise.withResolvers<void>();
    let command!: EntityCommand<void>;
    function Probe() {
      command = useEntityCommand({ send: () => send.promise });
      return <span />;
    }
    render(() => <Probe />);
    const done = command.run();
    flush();
    expect(command.busy()).toBe(true);
    send.resolve();
    expect(await done).toBe(true);
    flush();
    expect(command.busy()).toBe(false);
  });
});
