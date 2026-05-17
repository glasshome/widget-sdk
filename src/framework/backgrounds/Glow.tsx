/**
 * Glow Component
 *
 * Channel-driven background glow. Renders a blurred radial gradient at the
 * BACKGROUND z-index layer using the Widget's channel color. Defaults to the
 * parent Widget's `--widget-color`; pass `color` to override locally.
 *
 * @example
 * ```tsx
 * <Widget tone="info">
 *   <Glow />
 * </Widget>
 * ```
 *
 * @example With local override
 * ```tsx
 * <Glow color="oklch(0.7 0.2 30)" />
 * ```
 */

import type { JSX } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import { cn } from "../utils/cn";

interface GlowProps {
  /**
   * Optional CSS color string override (oklch, hsl, rgb, hex, var()).
   * Sets `--widget-color` locally on the Glow element. When omitted the
   * parent Widget's channel color cascades in.
   * BREAKING (Phase 26): previously a Tailwind color variant key.
   */
  color?: string;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Glow effect component, channel-driven radial gradient.
 */
export function Glow(props: GlowProps): JSX.Element {
  const style = (): JSX.CSSProperties => {
    const base: JSX.CSSProperties = {
      "z-index": WIDGET_Z.BACKGROUND,
      background:
        "radial-gradient(circle, color-mix(in oklch, var(--widget-color) 30%, transparent), transparent 70%)",
    };
    if (props.color) base["--widget-color"] = props.color;
    return base;
  };

  return (
    <div
      class={cn("pointer-events-none absolute inset-0 opacity-40 blur-3xl", props.class)}
      style={style()}
    />
  );
}
