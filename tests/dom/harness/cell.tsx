import type { JSX } from "solid-js";

/** A 3x3 widget's box on the dashboard grid, tall enough to show its controls. */
export function Cell(props: { children: JSX.Element }) {
  return <div style={{ width: "302px", height: "242px" }}>{props.children}</div>;
}
