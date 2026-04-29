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
 * Gradient configuration
 */
export interface GradientConfig {
  /** Tailwind gradient from class (e.g., "from-blue-500") */
  from: string;
  /** Tailwind gradient to class (e.g., "to-blue-700") */
  to: string;
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

/**
 * Color variants for common components
 */
export type ColorVariant = "blue" | "green" | "red" | "yellow" | "purple" | "gray" | string;

/**
 * Image overlay types
 */
export type ImageOverlay = "gradient" | "dark" | "none";

/**
 * Base props that all framework components accept
 */
export interface BaseComponentProps {
  /** Additional CSS classes (SolidJS uses `class` instead of `className`) */
  class?: string;
  /** Child elements */
  children?: JSX.Element;
}

// ============================================================================
// Variant System Types (CSS Variables + Discriminated Unions)
// ============================================================================

/**
 * CSS variable-based styling configuration
 * Replaces brittle Tailwind class strings with type-safe CSS variables
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
  /** Flex direction */
  direction: "row" | "column" | "row-reverse" | "column-reverse";
  /** Align items */
  align: "start" | "center" | "end" | "stretch";
  /** Justify content */
  justify: "start" | "center" | "end" | "between" | "around";
  /** Flex wrap */
  wrap?: boolean;
  /** Gap between items (CSS value) */
  gap?: string;
  /** Custom order for specific elements */
  order?: Partial<Record<WidgetElement, number>>;
}

/**
 * Grid layout strategy with type-safe configuration
 */
export interface GridLayoutStrategy {
  type: "grid";
  /** Grid template areas string */
  areas: string;
  /** Grid template columns */
  columns?: string;
  /** Grid template rows */
  rows?: string;
  /** Gap between items (CSS value) */
  gap?: string;
  /** Grid area assignments for elements */
  elementAreas: Partial<Record<WidgetElement, string>>;
}

/**
 * Absolute positioning strategy with type-safe configuration
 */
export interface AbsoluteLayoutStrategy {
  type: "absolute";
  /** Position configurations for specific elements */
  positions: Partial<Record<WidgetElement, PositionConfig>>;
}

/**
 * Custom layout strategy (escape hatch)
 */
export interface CustomLayoutStrategy {
  type: "custom";
  /** Custom render function or component */
  renderer: string; // Plugin ID that implements custom layout
}

/**
 * Discriminated union of all layout strategies
 * Ensures type safety - can't use gridArea with flex, etc.
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
  /** Show/hide specific elements */
  visible?: Partial<Record<WidgetElement, boolean>>;
  /** Element-specific styling */
  styles?: Partial<Record<WidgetElement, JSX.CSSProperties>>;
  /** Element-specific CSS classes */
  classNames?: Partial<Record<WidgetElement, string>>;
}

/**
 * Plugin system configuration (serializable)
 * Uses string IDs instead of JSX.Element for serializability
 */
export interface VariantPlugins {
  /** Background plugin ID */
  background?: string;
  /** Overlay plugin ID */
  overlay?: string;
  /** Decoration plugin IDs */
  decorations?: string[];
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
  /** Enable hover effects */
  hover?: boolean;
  /** Enable active/pressed state */
  active?: boolean;
  /** Enable focus ring */
  focus?: boolean;
  /** Custom hover scale (e.g., 1.02) */
  hoverScale?: number;
  /** Custom active scale (e.g., 0.98) */
  activeScale?: number;
}

/**
 * Complete variant configuration
 * This is the core of the variant system
 */
export interface WidgetVariantConfig {
  /** Unique variant identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of variant purpose/style */
  description?: string;
  /** Styling configuration */
  styles?: WidgetStyles;
  /** Layout strategy */
  layout?: LayoutStrategy;
  /** Element-specific configuration */
  elements?: ElementConfig;
  /** Plugin configurations */
  plugins?: VariantPlugins;
  /** Interaction behavior */
  interactions?: InteractionConfig;
  /** Base variant to extend (enables composition) */
  extends?: string;
}

/**
 * Variant type union (built-in + custom)
 */
export type WidgetVariant = "classic-glass" | "minimal" | "compact-horizontal" | (string & {}); // Allow custom variants while preserving autocomplete

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
  /** Entity attributes */
  attributes: Record<string, any>;
  /** When the state last changed (ISO 8601 string) */
  lastChanged: string;
  /** When the state was last updated, even if unchanged (ISO 8601 string) */
  lastUpdated: string;
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
