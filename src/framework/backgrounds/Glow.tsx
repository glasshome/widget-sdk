/**
 * Glow Component
 *
 * Background glow effect for widgets.
 * Renders a radial gradient background at the BACKGROUND z-index layer.
 *
 * @example
 * ```tsx
 * <Glow color="blue" />
 * ```
 */

import type { JSX } from "solid-js";
import { WIDGET_Z } from "../design-system/z-index";
import type { ColorVariant } from "../types";
import { cn } from "../utils/cn";

/**
 * Color variant to Tailwind background class mapping
 */
const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500/30",
  green: "bg-green-500/30",
  red: "bg-red-500/30",
  yellow: "bg-yellow-500/30",
  purple: "bg-purple-500/30",
  gray: "bg-gray-500/30",
};

export interface GlowProps {
  /** Glow color (Tailwind color name or CSS color) */
  color: ColorVariant;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Glow effect component
 * Applies a blurred radial gradient background effect
 */
export function Glow(props: GlowProps): JSX.Element {
  const colorClass = () => COLOR_MAP[props.color] ?? props.color;

  return (
    <div
      class={cn("pointer-events-none absolute inset-0", props.class)}
      style={{ "z-index": WIDGET_Z.BACKGROUND }}
    >
      <div class={cn("absolute inset-0 opacity-40 blur-3xl", colorClass())} />
    </div>
  );
}
