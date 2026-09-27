/** Core type definitions for the Widget Framework. */

import type { JSX } from "solid-js";

/** Slide gesture configuration */
interface SlideGestureConfig {
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
interface HoldGestureConfig {
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

/** Look applied to the widget shell: inline style, utility classes and CSS custom properties. */
export interface WidgetStyles {
  container?: JSX.CSSProperties;
  class?: string;
  cssVars?: Record<`--widget-${string}` | `--glass-${string}`, string | number>;
}

type WidgetElement =
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

/** @deprecated Never read by the shell. Removed in 2.0.0. */
type LayoutStrategy =
  | {
      type: "flex";
      direction: "row" | "column" | "row-reverse" | "column-reverse";
      align: "start" | "center" | "end" | "stretch";
      justify: "start" | "center" | "end" | "between" | "around";
      wrap?: boolean;
      gap?: string;
      order?: Partial<Record<WidgetElement, number>>;
    }
  | {
      type: "grid";
      areas: string;
      columns?: string;
      rows?: string;
      gap?: string;
      elementAreas: Partial<Record<WidgetElement, string>>;
    }
  | {
      type: "absolute";
      positions: Partial<
        Record<
          WidgetElement,
          { top?: string; right?: string; bottom?: string; left?: string; transform?: string }
        >
      >;
    }
  | { type: "custom"; renderer: string };

/** A custom shell look; only `styles` is applied. */
export interface WidgetVariantConfig {
  id: string;
  name: string;
  description?: string;
  styles?: WidgetStyles;
  /** @deprecated Never read by the shell. Removed in 2.0.0. */
  layout?: LayoutStrategy;
  /** @deprecated Never read by the shell. Removed in 2.0.0. */
  elements?: {
    visible?: Partial<Record<WidgetElement, boolean>>;
    styles?: Partial<Record<WidgetElement, JSX.CSSProperties>>;
    classNames?: Partial<Record<WidgetElement, string>>;
  };
  /** @deprecated Never read by the shell. Removed in 2.0.0. */
  plugins?: { background?: string; overlay?: string; decorations?: string[] };
  /** @deprecated Never read by the shell. Removed in 2.0.0. */
  interactions?: {
    hover?: boolean;
    active?: boolean;
    focus?: boolean;
    hoverScale?: number;
    activeScale?: number;
  };
  /** @deprecated Never read by the shell. Removed in 2.0.0. */
  extends?: string;
}

// ============================================================================
// Entity Type Aliases
// Structurally compatible with sync-layer's identical definitions.
// Both packages define these independently (structural typing, no imports).
// ============================================================================

/** Unique entity identifier (e.g., "light.living_room") */
type EntityId = string;
/** Entity domain (e.g., "light", "sensor", "switch") */
type EntityDomain = string;
/** Area identifier */
type AreaId = string;
/** Device identifier */
type DeviceId = string;
/** Label identifier */
type LabelId = string;
/** Entity category for filtering */
type EntityCategory = "config" | "diagnostic" | null;

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
    // oxlint-disable-next-line typescript/no-explicit-any -- public signature; tighten in 2.0
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
