/**
 * Spacing System
 *
 * Provides responsive spacing that adapts to widget size.
 *
 * @example
 * ```tsx
 * const { size } = useWidgetContext();
 *
 * <div style={{ "margin-top": spacing.iconToTitle(size) }}>
 *   <Widget.Title>{title}</Widget.Title>
 * </div>
 * ```
 */

import type { SpacingScale, WidgetSize } from "../types";

/**
 * Spacing scale values based on widget size
 */
const SPACING_SCALE = {
  S1: { xs: 4, sm: 4, md: 6, lg: 6, xl: 8 },
  S2: { xs: 6, sm: 8, md: 10, lg: 12, xl: 14 },
  S3: { xs: 8, sm: 10, md: 12, lg: 14, xl: 16 },
  S4: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
} as const;

/**
 * Get spacing value based on widget size
 */
export const spacing = {
  /** Extra small spacing (4-8px) */
  S1: (size: WidgetSize): string => {
    return `${SPACING_SCALE.S1[size]}px`;
  },

  /** Small spacing (6-14px) - default for most layouts */
  S2: (size: WidgetSize): string => {
    return `${SPACING_SCALE.S2[size]}px`;
  },

  /** Medium spacing (8-16px) */
  S3: (size: WidgetSize): string => {
    return `${SPACING_SCALE.S3[size]}px`;
  },

  /** Large spacing (12-20px) */
  S4: (size: WidgetSize): string => {
    return `${SPACING_SCALE.S4[size]}px`;
  },

  /** Icon container size in pixels */
  icon: (size: WidgetSize): number => {
    const sizes = {
      xs: 32, // 1x1, 1x2 widgets
      sm: 40, // 2x1, 2x2 widgets (current WidgetIcon default)
      md: 48, // 2x3, 2x4 widgets
      lg: 52, // 2x6, 3x6, 4x2 widgets
      xl: 56, // 4x4 widgets
    };
    return sizes[size];
  },

  /** Icon stroke size for lucide icons */
  iconSize: (size: WidgetSize): number => {
    const sizes = {
      xs: 18, // Smaller stroke for tiny widgets
      sm: 20, // Current WidgetIcon default (size-5 = 20px)
      md: 24, // Medium widgets
      lg: 26, // Large widgets
      xl: 28, // Extra large widgets
    };
    return sizes[size];
  },

  /** Spacing between icon and title */
  iconToTitle: (size: WidgetSize): string => {
    const sizes = {
      xs: "8px", // Tight spacing for small widgets
      sm: "10px", // Slightly more room
      md: "12px", // Current pattern from LockWidget (@[300px]:mt-3 = 12px)
      lg: "14px", // More breathing room
      xl: "16px", // Maximum spacing (@[400px]:mt-4 = 16px)
    };
    return sizes[size];
  },

  /** Container padding */
  container: (size: WidgetSize): string => {
    const sizes = {
      xs: "8px", // Minimal padding for tiny widgets
      sm: "16px", // Current BaseWidget default (p-4 = 16px)
      md: "16px",
      lg: "20px", // More padding for larger widgets
      xl: "20px",
    };
    return sizes[size];
  },
};

/** Map from pixel spacing values to Tailwind gap classes (hoisted to avoid per-call allocation) */
const SPACING_CLASS_MAP: Record<number, string> = {
  4: "gap-1",
  6: "gap-1.5",
  8: "gap-2",
  10: "gap-2.5",
  12: "gap-3",
  14: "gap-3.5",
  16: "gap-4",
  18: "gap-[18px]",
  20: "gap-5",
};

/**
 * Get Tailwind spacing class name for layout components
 */
export function getSpacingClass(scale: SpacingScale, size: WidgetSize): string {
  const value = SPACING_SCALE[scale][size];
  return SPACING_CLASS_MAP[value] || `gap-[${value}px]`;
}
