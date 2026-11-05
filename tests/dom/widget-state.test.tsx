import { render, screen } from "@solidjs/testing-library";
import { checkWidgetStateWrite } from "@glasshome/widget-contract/state";
import { createSignal, type Signal } from "solid-js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  type ReactiveWidgetContext,
  useWidgetState,
  WidgetCtx,
  type WidgetStateStore,
  type WidgetStateVerdict,
} from "../../src/framework/hooks";

const RecentSchema = z.array(z.tuple([z.number(), z.number()])).max(4);
type Recent = z.infer<typeof RecentSchema>;

function hostStore(seed: Record<string, string> = {}, verdict?: WidgetStateVerdict) {
  const signals = new Map<string, Signal<string | undefined>>();
  const signalFor = (key: string) => {
    let signal = signals.get(key);
    if (!signal) {
      signal = createSignal<string | undefined>(seed[key]);
      signals.set(key, signal);
    }
    return signal;
  };
  const writes: Array<[string, string | null]> = [];
  const store: WidgetStateStore = {
    read: (key) => {
      const text = signalFor(key)[0]();
      return text === undefined ? undefined : JSON.parse(text);
    },
    write(key, value) {
      const json = value === undefined ? null : JSON.stringify(value);
      const current = Object.fromEntries(
        [...signals].flatMap(([k, [get]]) => {
          const text = get();
          return text === undefined ? [] : [[k, text]];
        }),
      );
      const answer = verdict ?? checkWidgetStateWrite(current, key, json);
      if (answer !== "ok") return answer;
      writes.push([key, json]);
      signalFor(key)[1](json ?? undefined);
      return answer;
    },
  };
  const setFromHost = (key: string, json: string | undefined) => signalFor(key)[1](json);
  return { store, writes, setFromHost };
}

const ctxWith = (state?: WidgetStateStore): ReactiveWidgetContext => ({
  updateConfig: () => {},
  dimensions: () => ({ width: 0, height: 0 }),
  state,
});

let setRecent: (next: Recent | ((prev: Recent) => Recent)) => WidgetStateVerdict = () => "off";

function Probe(props: { id: string }) {
  const [recent, set] = useWidgetState("recent", RecentSchema, []);
  setRecent = set;
  return (
    <span data-testid={props.id}>
      {recent()
        .map((pair) => pair.join(","))
        .join(" ")}
    </span>
  );
}

function mount(ctx: ReactiveWidgetContext) {
  render(() => (
    <WidgetCtx.Provider value={ctx}>
      <Probe id="a" />
      <Probe id="b" />
    </WidgetCtx.Provider>
  ));
}

const text = (id: string) => screen.getByTestId(id).textContent;

describe("useWidgetState", () => {
  it("reads the host's value through the schema", () => {
    mount(ctxWith(hostStore({ recent: "[[216,75]]" }).store));
    expect(text("a")).toBe("216,75");
  });

  it("a stored value its schema refuses reads the fallback", () => {
    mount(ctxWith(hostStore({ recent: '"teal"' }).store));
    expect(text("a")).toBe("");
  });

  it("a host change to the key reaches every reader", () => {
    const host = hostStore();
    mount(ctxWith(host.store));
    host.setFromHost("recent", "[[1,2]]");
    expect(text("a")).toBe("1,2");
    expect(text("b")).toBe("1,2");
  });

  it("a write reaches the host once and every reader of the key", () => {
    const host = hostStore({ recent: "[[1,2]]" });
    mount(ctxWith(host.store));
    expect(setRecent((prev) => [[3, 4], ...prev])).toBe("ok");
    expect(host.writes).toEqual([["recent", "[[3,4],[1,2]]"]]);
    expect(text("a")).toBe("3,4 1,2");
    expect(text("b")).toBe("3,4 1,2");
  });

  it("an oversize write returns value and changes nothing", () => {
    const host = hostStore({ recent: "[[1,2]]" });
    mount(ctxWith(host.store));
    const oversize = Array.from({ length: 2000 }, () => [123.456, 78.9] as [number, number]);
    expect(setRecent(oversize)).toBe("value");
    expect(host.writes).toEqual([]);
    expect(text("a")).toBe("1,2");
  });

  it("a write the host turns off returns off and changes nothing", () => {
    const host = hostStore({ recent: "[[1,2]]" }, "off");
    mount(ctxWith(host.store));
    expect(setRecent([[5, 6]])).toBe("off");
    expect(text("a")).toBe("1,2");
  });

  it("without a host store the hook keeps values for the mount", () => {
    mount(ctxWith());
    expect(text("a")).toBe("");
    expect(setRecent([[7, 8]])).toBe("ok");
    expect(text("a")).toBe("7,8");
    expect(text("b")).toBe("7,8");
    expect(setRecent(Array.from({ length: 2000 }, () => [123.456, 78.9]))).toBe("value");
    expect(text("a")).toBe("7,8");
  });

  it("throws outside a widget", () => {
    expect(() => render(() => <Probe id="c" />)).toThrow(/within a Widget/);
  });
});
