/**
 * Variant Composition Utilities
 *
 * Utilities for creating, merging, extending, and composing widget variants.
 * Enables flexible variant system with type safety and composability.
 */

import type {
  ElementConfig,
  FlexLayoutStrategy,
  InteractionConfig,
  LayoutStrategy,
  VariantPlugins,
  WidgetStyles,
  WidgetVariantConfig,
} from "../types";

// ============================================================================
// Deep Merge Utilities
// ============================================================================

/**
 * Deep merge two objects, with right taking precedence
 * Arrays are replaced, not merged
 */
function deepMerge<T>(left: T, right: Partial<T>): T {
  if (typeof left !== "object" || left === null) {
    return right as T;
  }

  const result = { ...left };

  for (const key in right) {
    const rightValue = right[key];
    const leftValue = left[key];

    if (rightValue === undefined) {
      continue;
    }

    // Arrays are replaced, not merged
    if (Array.isArray(rightValue)) {
      (result as any)[key] = rightValue;
      continue;
    }

    // Objects are deeply merged
    if (typeof rightValue === "object" && rightValue !== null && !Array.isArray(rightValue)) {
      if (typeof leftValue === "object" && leftValue !== null) {
        (result as any)[key] = deepMerge(leftValue, rightValue);
      } else {
        (result as any)[key] = rightValue;
      }
      continue;
    }

    // Primitives are replaced
    (result as any)[key] = rightValue;
  }

  return result;
}

// ============================================================================
// Variant Merge Functions
// ============================================================================

/**
 * Merge two WidgetStyles configurations
 */
function mergeStyles(
  base: WidgetStyles | undefined,
  override: WidgetStyles | undefined,
): WidgetStyles | undefined {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;

  return {
    container: { ...base.container, ...override.container },
    class: override.class ?? base.class,
    cssVars: { ...base.cssVars, ...override.cssVars },
  };
}

/**
 * Merge two layout strategies
 * Override completely replaces base (layouts are not mergeable)
 */
function mergeLayout(
  base: LayoutStrategy | undefined,
  override: LayoutStrategy | undefined,
): LayoutStrategy | undefined {
  return override ?? base;
}

/**
 * Merge two ElementConfig configurations
 */
function mergeElements(
  base: ElementConfig | undefined,
  override: ElementConfig | undefined,
): ElementConfig | undefined {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;

  return {
    visible: { ...base.visible, ...override.visible },
    styles: deepMerge(base.styles ?? {}, override.styles ?? {}),
    classNames: { ...base.classNames, ...override.classNames },
  };
}

/**
 * Merge two VariantPlugins configurations
 */
function mergePlugins(
  base: VariantPlugins | undefined,
  override: VariantPlugins | undefined,
): VariantPlugins | undefined {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;

  return {
    background: override.background ?? base.background,
    overlay: override.overlay ?? base.overlay,
    decorations: override.decorations ?? base.decorations,
  };
}

/**
 * Merge two InteractionConfig configurations
 */
function mergeInteractions(
  base: InteractionConfig | undefined,
  override: InteractionConfig | undefined,
): InteractionConfig | undefined {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;

  return {
    hover: override.hover ?? base.hover,
    active: override.active ?? base.active,
    focus: override.focus ?? base.focus,
    hoverScale: override.hoverScale ?? base.hoverScale,
    activeScale: override.activeScale ?? base.activeScale,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Merge two complete variant configurations
 *
 * Deep merges all properties, with `override` taking precedence.
 * Layout strategies are replaced, not merged (since they have different shapes).
 *
 * @example
 * ```tsx
 * const customVariant = mergeVariants(classicGlass, {
 *   styles: {
 *     cssVars: {
 *       "--widget-bg": "rgba(0, 0, 0, 0.5)"
 *     }
 *   }
 * });
 * ```
 */
export function mergeVariants(
  base: WidgetVariantConfig,
  override: Partial<WidgetVariantConfig>,
): WidgetVariantConfig {
  return {
    id: override.id ?? base.id,
    name: override.name ?? base.name,
    description: override.description ?? base.description,
    styles: mergeStyles(base.styles, override.styles),
    layout: mergeLayout(base.layout, override.layout),
    elements: mergeElements(base.elements, override.elements),
    plugins: mergePlugins(base.plugins, override.plugins),
    interactions: mergeInteractions(base.interactions, override.interactions),
    extends: override.extends ?? base.extends,
  };
}

/**
 * Extend a base variant with partial overrides
 *
 * Similar to mergeVariants but returns a new variant that references the base
 * via the `extends` property. Useful for variant inheritance chains.
 *
 * @example
 * ```tsx
 * const darkGlass = extendVariant("classic-glass", {
 *   id: "dark-glass",
 *   name: "Dark Glass",
 *   styles: {
 *     cssVars: {
 *       "--widget-bg": "rgba(0, 0, 0, 0.5)"
 *     }
 *   }
 * });
 * ```
 */
export function extendVariant(
  baseId: string,
  override: Partial<WidgetVariantConfig> & { id: string; name: string },
): WidgetVariantConfig {
  return {
    ...override,
    extends: baseId,
  };
}

/**
 * Compose multiple variants together (left to right precedence)
 *
 * Merges multiple variants in sequence, with later variants taking precedence.
 * Useful for combining layout + styling + interaction variants.
 *
 * @example
 * ```tsx
 * const custom = composeVariants(
 *   minimal,           // Base: minimal styling
 *   centeredLayout,    // Add: centered layout
 *   largeIcons         // Add: large icon sizing
 * );
 * ```
 */
export function composeVariants(...variants: WidgetVariantConfig[]): WidgetVariantConfig {
  if (variants.length === 0) {
    throw new Error("composeVariants requires at least one variant");
  }

  if (variants.length === 1) {
    return variants[0]!;
  }

  return variants.reduce((acc, variant) => mergeVariants(acc, variant));
}

/**
 * Apply a layout strategy override to a variant
 *
 * Convenience function for changing just the layout of a variant.
 *
 * @example
 * ```tsx
 * const centered = applyLayout(minimal, {
 *   type: "flex",
 *   direction: "column",
 *   align: "center",
 *   justify: "center"
 * });
 * ```
 */
export function applyLayout(
  variant: WidgetVariantConfig,
  layout: LayoutStrategy,
): WidgetVariantConfig {
  return mergeVariants(variant, { layout });
}

/**
 * Apply CSS variable overrides to a variant
 *
 * Convenience function for changing just the CSS variables of a variant.
 *
 * @example
 * ```tsx
 * const blueTinted = applyCssVars(classicGlass, {
 *   "--widget-bg": "rgba(59, 130, 246, 0.2)",
 *   "--widget-border": "rgba(59, 130, 246, 0.3)"
 * });
 * ```
 */
export function applyCssVars(
  variant: WidgetVariantConfig,
  cssVars: Record<`--widget-${string}`, string | number>,
): WidgetVariantConfig {
  return mergeVariants(variant, {
    styles: { cssVars },
  });
}

/**
 * Create a flex layout strategy
 *
 * Convenience function for creating common flex layouts.
 *
 * @example
 * ```tsx
 * const layout = createFlexLayout("column", "center", "center");
 * ```
 */
export function createFlexLayout(
  direction: FlexLayoutStrategy["direction"] = "column",
  align: FlexLayoutStrategy["align"] = "start",
  justify: FlexLayoutStrategy["justify"] = "start",
  options?: Partial<FlexLayoutStrategy>,
): FlexLayoutStrategy {
  return {
    type: "flex",
    direction,
    align,
    justify,
    ...options,
  };
}
