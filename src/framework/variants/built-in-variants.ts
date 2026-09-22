/**
 * Built-in Widget Variants
 *
 * Simplified set of pre-built variant definitions that ship with the framework.
 * These variants can be used as-is or extended/composed.
 *
 * Includes 3 core variants (classic-glass, minimal, compact-horizontal).
 * Additional variants can be added later or created by widget authors
 * using the variant composition utilities.
 */

import type { VariantRegistry, WidgetVariantConfig } from "../types";

// ============================================================================
// 1. Classic Glass (Default)
// ============================================================================

export const classicGlass: WidgetVariantConfig = {
  id: "classic-glass",
  name: "Classic Glass",
  description: "Default glassmorphism design with blur background and gradient",
  styles: {
    cssVars: {
      "--widget-padding": "1.5rem",
      // ui CARD_BLUR as a cssVar: the host's performant-blur sheet gates this channel.
      "--widget-backdrop": "blur(var(--glass-blur, 24px)) saturate(1.8)",
    },
  },
  layout: {
    type: "flex",
    direction: "column",
    align: "start",
    justify: "start",
    gap: "0.75rem",
  },
  interactions: {
    hover: true,
    active: true,
    focus: true,
    hoverScale: 1.02,
    activeScale: 0.98,
  },
};

// ============================================================================
// 2. Minimal
// ============================================================================

export const minimal: WidgetVariantConfig = {
  id: "minimal",
  name: "Minimal",
  description: "Clean, minimal design with no background effects",
  styles: {
    cssVars: {
      "--widget-padding": "1rem",
      "--glass-base": "transparent",
      "--glass-wash": "0%",
      "--glass-light": "0",
      "--glass-rim": "0",
      "--glass-lift": "0",
      "--glass-edge": "transparent",
    },
  },
  layout: {
    type: "flex",
    direction: "column",
    align: "start",
    justify: "start",
    gap: "0.5rem",
  },
  elements: {
    visible: {
      background: false,
      decorations: false,
    },
  },
  interactions: {
    hover: false,
    active: false,
    focus: true,
  },
};

// ============================================================================
// 3. Compact Horizontal
// ============================================================================

export const compactHorizontal: WidgetVariantConfig = {
  id: "compact-horizontal",
  name: "Compact Horizontal",
  description: "Horizontal layout for compact widgets",
  styles: {
    cssVars: {
      "--widget-padding": "1rem",
      "--widget-icon-size": "2.5rem",
      "--widget-backdrop": "blur(16px) saturate(1.8)",
    },
  },
  layout: {
    type: "flex",
    direction: "row",
    align: "center",
    justify: "start",
    gap: "1rem",
  },
  interactions: {
    hover: true,
    active: true,
    focus: true,
    hoverScale: 1.02,
    activeScale: 0.98,
  },
};

// ============================================================================
// Variant Registry
// ============================================================================

/**
 * Built-in variant registry
 * Maps variant IDs to their configurations
 */
export const builtInVariants: VariantRegistry = {
  "classic-glass": classicGlass,
  minimal: minimal,
  "compact-horizontal": compactHorizontal,
};

/**
 * Get a variant by ID from the built-in registry
 *
 * @param id Variant ID
 * @returns Variant configuration or undefined if not found
 */
export function getBuiltInVariant(id: string): WidgetVariantConfig | undefined {
  return builtInVariants[id];
}

/**
 * Check if a variant ID is a built-in variant
 *
 * @param id Variant ID to check
 * @returns True if the variant is built-in
 */
export function isBuiltInVariant(id: string): boolean {
  return id in builtInVariants;
}

/**
 * Get all built-in variant IDs
 *
 * @returns Array of built-in variant IDs
 */
export function getBuiltInVariantIds(): string[] {
  return Object.keys(builtInVariants);
}
