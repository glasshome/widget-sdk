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
      "--widget-bg": "rgba(255, 255, 255, 0.1)",
      "--widget-border": "rgba(255, 255, 255, 0.2)",
      "--widget-blur": "12px",
      "--widget-shadow": "0 8px 32px rgba(0, 0, 0, 0.2)",
      "--widget-padding": "1.5rem",
    },
    class: "backdrop-blur-xl",
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
      "--widget-bg": "transparent",
      "--widget-border": "rgba(255, 255, 255, 0.1)",
      "--widget-padding": "1rem",
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
      "--widget-bg": "rgba(255, 255, 255, 0.08)",
      "--widget-border": "rgba(255, 255, 255, 0.15)",
      "--widget-blur": "10px",
      "--widget-padding": "1rem",
      "--widget-icon-size": "2.5rem",
    },
    class: "backdrop-blur-lg",
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
