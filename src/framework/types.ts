/** Core type definitions for the Widget Framework. */

import type { JSX } from "solid-js";

/**
 * Widget size classification based on grid dimensions
 * - xs: Small widgets (1x1, 1x2)
 * - sm: Medium-small widgets (2x1, 2x2)
 * - md: Medium widgets (2x3, 2x4)
 * - lg: Large widgets (2x6, 3x6, 4x2)
 * - xl: Extra large widgets (4x4)
 */
export type WidgetSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Widget orientation based on aspect ratio
 * - horizontal: width > height
 * - vertical: height > width
 * - square: width === height
 */
export type WidgetOrientation = "horizontal" | "vertical" | "square";

/**
 * Widget dimensions in both pixels and grid units
 */
export interface WidgetDimensions {
  /** Pixel width */
  width: number;
  /** Pixel height */
  height: number;
  /** Grid columns (1-4) */
  gridWidth: number;
  /** Grid rows (1-6) */
  gridHeight: number;
}

/**
 * Widget context provided to all child components.
 * Values are plain (not accessors) -- the context provider
 * will supply reactive accessors wrapping these.
 */
export interface WidgetContextValue {
  /** Widget size classification */
  size: WidgetSize;
  /** Widget orientation (for gestures - pure aspect ratio) */
  orientation: WidgetOrientation;
  /** Content layout direction (for UI arrangement - considers height) */
  contentLayout: WidgetOrientation;
  /** Widget dimensions */
  dimensions: WidgetDimensions;
  /** Whether widget is in edit mode */
  isEditMode: boolean;
}

/**
 * Slide gesture configuration
 */
export interface SlideGestureConfig {
  /** Current value */
  value: number;
  /** Value change handler */
  onChange: (value: number) => void;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Slide orientation (default: "auto" - detects from widget orientation) */
  orientation?: "auto" | "horizontal" | "vertical";
  /** Delay before slide activates in ms (prevents scroll conflicts, default: 0) */
  activationDelay?: number;
}

/**
 * Hold gesture configuration
 */
export interface HoldGestureConfig {
  /** Action to perform on hold */
  action: () => void;
  /** Hold delay in ms (default: 300) */
  delay?: number;
}

/**
 * Combined gesture configuration
 */
export interface GestureConfig {
  /** Simple tap handler */
  tap?: () => void;
  /** Hold gesture configuration */
  hold?: HoldGestureConfig;
  /** Slide gesture configuration */
  slide?: SlideGestureConfig;
}

/**
 * Spacing scale
 */
export type SpacingScale = "S1" | "S2" | "S3" | "S4";

// ============================================================================
// Variant System Types (CSS Variables + Discriminated Unions)
// Internal use only — not re-exported from the public SDK surface.
// ============================================================================

/**
 * CSS variable-based styling configuration
 */
export interface WidgetStyles {
  /** Inline CSS properties applied to widget container */
  container?: JSX.CSSProperties;
  /** Tailwind utility classes (for simple styling) */
  class?: string;
  /** CSS custom properties for themeable values */
  cssVars?: Record<`--widget-${string}`, string | number>;
}

/**
 * Flex layout strategy with type-safe configuration
 */
export interface FlexLayoutStrategy {
  type: "flex";
  direction: "row" | "column" | "row-reverse" | "column-reverse";
  align: "start" | "center" | "end" | "stretch";
  justify: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
  gap?: string;
  order?: Partial<Record<WidgetElement, number>>;
}

/**
 * Grid layout strategy with type-safe configuration
 */
export interface GridLayoutStrategy {
  type: "grid";
  areas: string;
  columns?: string;
  rows?: string;
  gap?: string;
  elementAreas: Partial<Record<WidgetElement, string>>;
}

/**
 * Absolute positioning strategy with type-safe configuration
 */
export interface AbsoluteLayoutStrategy {
  type: "absolute";
  positions: Partial<Record<WidgetElement, PositionConfig>>;
}

/**
 * Custom layout strategy (escape hatch)
 */
export interface CustomLayoutStrategy {
  type: "custom";
  renderer: string;
}

/**
 * Discriminated union of all layout strategies
 */
export type LayoutStrategy =
  | FlexLayoutStrategy
  | GridLayoutStrategy
  | AbsoluteLayoutStrategy
  | CustomLayoutStrategy;

/**
 * Position configuration for absolute layout
 */
export interface PositionConfig {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  transform?: string;
}

/**
 * Widget element identifiers for layout configuration
 */
export type WidgetElement =
  | "icon"
  | "title"
  | "subtitle"
  | "status"
  | "value"
  | "metrics"
  | "content"
  | "background"
  | "overlay"
  | "decorations";

/**
 * Element-specific configuration
 */
export interface ElementConfig {
  visible?: Partial<Record<WidgetElement, boolean>>;
  styles?: Partial<Record<WidgetElement, JSX.CSSProperties>>;
  classNames?: Partial<Record<WidgetElement, string>>;
}

/**
 * Plugin system configuration (serializable)
 */
export interface VariantPlugins {
  background?: string;
  overlay?: string;
  decorations?: string[];
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
  hover?: boolean;
  active?: boolean;
  focus?: boolean;
  hoverScale?: number;
  activeScale?: number;
}

/**
 * Complete variant configuration
 */
export interface WidgetVariantConfig {
  id: string;
  name: string;
  description?: string;
  styles?: WidgetStyles;
  layout?: LayoutStrategy;
  elements?: ElementConfig;
  plugins?: VariantPlugins;
  interactions?: InteractionConfig;
  extends?: string;
}

/**
 * Variant registry type
 */
export type VariantRegistry = Record<string, WidgetVariantConfig>;

// ============================================================================
// Entity Type Aliases
// Structurally compatible with sync-layer's identical definitions.
// Both packages define these independently (structural typing, no imports).
// ============================================================================

/** Unique entity identifier (e.g., "light.living_room") */
export type EntityId = string;
/** Entity domain (e.g., "light", "sensor", "switch") */
export type EntityDomain = string;
/** Area identifier */
export type AreaId = string;
/** Device identifier */
export type DeviceId = string;
/** Label identifier */
export type LabelId = string;
/** Entity category for filtering */
export type EntityCategory = "config" | "diagnostic" | null;

// ============================================================================
// Entity View (full type — the contract between sync-layer and widgets)
// ============================================================================

/**
 * Full entity view interface representing a Home Assistant entity.
 * This is the canonical type used by SDK framework utils and widgets.
 * sync-layer produces EntityView objects; widgets consume them.
 */
export interface EntityView {
  // -- Runtime State --

  /** Unique entity identifier (e.g., "light.living_room") */
  id: EntityId;
  /** Entity domain (e.g., "light", "sensor") */
  domain: EntityDomain;
  /** Current state value */
  state: string;
  /**
   * Entity attributes from Home Assistant, excluding keys that are
   * surfaced as canonical resolved fields elsewhere on EntityView
   * (`deviceClass`, `unitOfMeasurement`, `friendlyName`, `icon`).
   * Use those fields instead of reaching into `attributes`.
   */
  attributes: Omit<
    Record<string, any>,
    "device_class" | "unit_of_measurement" | "friendly_name" | "icon"
  >;
  /** When the state last changed */
  lastChanged: Date;
  /** When the state was last updated (even if unchanged) */
  lastUpdated: Date;
  /** Context of the last state change */
  context: {
    id: string;
    parentId: string | null;
    userId: string | null;
  };

  // -- Registry Metadata --

  /** Internal entity name (object_id) */
  name: string;
  /** Friendly display name */
  friendlyName: string;
  /** Area this entity belongs to */
  areaId: AreaId | null;
  /** Device this entity belongs to */
  deviceId: DeviceId | null;
  /** Integration platform (e.g., "hue", "zwave") */
  platform: string;
  /** Unique ID from the integration */
  uniqueId: string | null;

  // -- Computed Properties --

  /** Whether the entity is disabled */
  isDisabled: boolean;
  /** Whether the entity is hidden from the UI */
  isHidden: boolean;
  /** Icon identifier (e.g., "mdi:lightbulb") */
  icon: string | null;
  /** Source of the icon */
  iconSource: "registry" | "attribute" | "default";
  /** Entity category for filtering */
  entityCategory: EntityCategory;

  // -- Collections --

  /** Labels assigned to this entity */
  labels: LabelId[];
  /** User-defined aliases */
  aliases: string[];

  // -- Optional Extended Data --

  /** Device class (e.g., "temperature", "motion") */
  deviceClass?: string | null;
  /** Unit of measurement (for sensors) */
  unitOfMeasurement?: string | null;
  /** Bitmask of supported features */
  supportedFeatures?: number;
}
