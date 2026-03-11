/**
 * Typography System
 *
 * Provides responsive typography classes that adapt to widget size.
 *
 * @example
 * ```tsx
 * const { size } = useWidgetContext();
 *
 * <h3 class={cn("font-bold text-white", typography.title(size))}>
 *   {title}
 * </h3>
 * ```
 */

import type { WidgetSize } from "../types";

/**
 * Typography utilities based on current widget patterns
 * Matches existing container query breakpoints from LockWidget:
 * - text-sm @[300px]:text-base @[400px]:text-lg
 */
export const typography = {
  /** Container base text sizing */
  container: (size: WidgetSize): string => {
    const classes = {
      xs: "text-xs", // Smallest widgets
      sm: "text-sm", // Small widgets
      md: "text-base", // Medium widgets
      lg: "text-base", // Large widgets
      xl: "text-lg", // Extra large widgets
    };
    return classes[size];
  },

  /** Title text sizing (main heading) */
  title: (size: WidgetSize): string => {
    const classes = {
      xs: "text-xs", // 12px - Very compact
      sm: "text-xs", // 12px - Stay small
      md: "text-sm", // 14px - More readable (@[300px] equivalent)
      lg: "text-sm", // 14px - Maintain size
      xl: "text-sm", // 14px - Don't go too large for secondary text
    };
    return classes[size];
  },

  /** Subtitle/secondary text sizing */
  subtitle: (size: WidgetSize): string => {
    // Based on LockWidget status text: text-xs @[300px]:text-sm
    const classes = {
      xs: "text-xs", // 12px - Very compact
      sm: "text-sm", // 12px - Stay small
      md: "text-base", // 14px - More readable (@[300px] equivalent)
      lg: "text-base", // 14px - Maintain size
      xl: "text-base", // 14px - Don't go too large for secondary text
    };
    return classes[size];
  },

  /** Value display text sizing (large numbers) */
  value: (size: WidgetSize): string => {
    const classes = {
      xs: "text-lg", // 18px - Still readable on small widgets
      sm: "text-xl", // 20px - Slightly larger
      md: "text-2xl", // 24px - Prominent
      lg: "text-3xl", // 30px - Very prominent
      xl: "text-4xl", // 36px - Maximum impact
    };
    return classes[size];
  },

  /** Badge text sizing (entity count badges) */
  badge: (size: WidgetSize): string => {
    // Based on LockWidget badge: text-xs @[300px]:text-xs
    const classes = {
      xs: "text-xs", // 12px - Compact badge
      sm: "text-xs", // 12px - Keep small
      md: "text-xs", // 12px - Badges should stay small
      lg: "text-sm", // 14px - Slightly larger for readability
      xl: "text-sm", // 14px - Maximum badge size
    };
    return classes[size];
  },

  /** Metric label text sizing */
  metricLabel: (size: WidgetSize): string => {
    const classes = {
      xs: "text-xs", // 12px - Compact labels
      sm: "text-xs", // 12px
      md: "text-xs", // 12px - Labels stay small
      lg: "text-sm", // 14px - More readable on large widgets
      xl: "text-sm", // 14px
    };
    return classes[size];
  },

  /** Metric value text sizing */
  metricValue: (size: WidgetSize): string => {
    const classes = {
      xs: "text-sm", // 14px - Readable metric values
      sm: "text-sm", // 14px
      md: "text-sm", // 14px - Keep metrics compact
      lg: "text-base", // 16px - Slightly larger
      xl: "text-base", // 16px
    };
    return classes[size];
  },

  /** Status text (same as subtitle but semantic) */
  status: (size: WidgetSize): string => {
    const classes = {
      xs: "text-md",
      sm: "text-xl",
      md: "text-2xl",
      lg: "text-3xl",
      xl: "text-3xl",
    };
    return classes[size];
  },

  /** Empty state message text */
  emptyState: (size: WidgetSize): string => {
    const classes = {
      xs: "text-xs", // 12px
      sm: "text-sm", // 14px
      md: "text-sm", // 14px
      lg: "text-base", // 16px
      xl: "text-base", // 16px
    };
    return classes[size];
  },
};
