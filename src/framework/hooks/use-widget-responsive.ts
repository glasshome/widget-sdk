/**
 * Widget Responsive Hook
 *
 * Provides convenience utilities for responsive behavior based on widget size.
 * Uses createMemo for each derived boolean to avoid unnecessary recalculation.
 *
 * @example
 * ```tsx
 * const responsive = useWidgetResponsive();
 *
 * return (
 *   <div>
 *     <Show when={responsive.showDetail()}>
 *       <DetailedMetrics />
 *     </Show>
 *     <Show when={responsive.isCompact()}>
 *       <CompactView />
 *     </Show>
 *   </div>
 * );
 * ```
 */

import { createMemo } from "solid-js";
import type { WidgetSize } from "../types";
import { useWidgetContext } from "./use-widget-context";

export interface WidgetResponsiveUtils {
  /** xs or sm */
  isCompact: () => boolean;
  /** lg or xl */
  isLarge: () => boolean;
  /** md or larger */
  showDetail: () => boolean;
  /** Check if current size matches any of the provided sizes */
  showOn: (sizes: WidgetSize[]) => boolean;
  /** Check if current size does NOT match any of the provided sizes */
  hideOn: (sizes: WidgetSize[]) => boolean;
  /** Check if a size condition matches (e.g., "md+", "sm-") */
  matches: (condition: string) => boolean;
}

const SIZE_ORDER: WidgetSize[] = ["xs", "sm", "md", "lg", "xl"];

/**
 * Get responsive utilities based on widget context size
 */
export function useWidgetResponsive(): WidgetResponsiveUtils {
  const ctx = useWidgetContext();

  const sizeIndex = createMemo(() => SIZE_ORDER.indexOf(ctx.size()));

  const isCompact = createMemo(() => {
    const size = ctx.size();
    return size === "xs" || size === "sm";
  });

  const isLarge = createMemo(() => {
    const size = ctx.size();
    return size === "lg" || size === "xl";
  });

  const showDetail = createMemo(() => {
    return sizeIndex() >= 2; // md or larger
  });

  const showOn = (sizes: WidgetSize[]): boolean => {
    return sizes.includes(ctx.size());
  };

  const hideOn = (sizes: WidgetSize[]): boolean => {
    return !sizes.includes(ctx.size());
  };

  const matches = (condition: string): boolean => {
    const trimmed = condition.trim();
    if (trimmed.endsWith("+")) {
      const baseSize = trimmed.slice(0, -1) as WidgetSize;
      const baseIndex = SIZE_ORDER.indexOf(baseSize);
      return baseIndex >= 0 && sizeIndex() >= baseIndex;
    }
    if (trimmed.endsWith("-")) {
      const baseSize = trimmed.slice(0, -1) as WidgetSize;
      const baseIndex = SIZE_ORDER.indexOf(baseSize);
      return baseIndex >= 0 && sizeIndex() <= baseIndex;
    }
    // Exact match
    return ctx.size() === trimmed;
  };

  return {
    isCompact,
    isLarge,
    showDetail,
    showOn,
    hideOn,
    matches,
  };
}
