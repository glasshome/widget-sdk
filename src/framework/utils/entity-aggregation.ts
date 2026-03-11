/**
 * Entity Aggregation Utilities
 *
 * Generic entity aggregation patterns for multi-entity widgets.
 * These utilities aggregate state across multiple entities to produce
 * a single representative state for the group.
 */

import type { EntityView } from "../types";

/**
 * Sensor group calculation modes
 */
export type SensorGroupType =
  | "min"
  | "max"
  | "mean"
  | "median"
  | "sum"
  | "last"
  | "range"
  | "product"
  | "std_dev";

/**
 * Light/switch/binary-sensor group aggregation result
 */
export interface LightGroupResult {
  /** Is this a group or single entity */
  isGroup: boolean;
  /** Collective state */
  state: string;
  /** Is on */
  isOn: boolean;
  /** Is unavailable */
  isUnavailable: boolean;
  /** Average brightness (0-255) */
  brightness: number;
  /** Brightness percentage (0-100) */
  brightnessPercent: number;
  /** RGB color for display */
  color: string;
  /** Number of entities on */
  onCount: number;
  /** Total entities */
  totalCount: number;
  /** Human readable description */
  description: string;
}

/**
 * Sensor group aggregation result
 */
export interface SensorGroupResult {
  /** Is this a group or single entity */
  isGroup: boolean;
  /** Collective state/value */
  state: string;
  /** Numeric value (if applicable) */
  numericValue: number | null;
  /** Is unavailable */
  isUnavailable: boolean;
  /** Unit of measurement */
  unit?: string;
  /** Human readable description */
  description: string;
  /** All member values (for debugging/display) */
  memberValues?: Array<{ entityId: string; value: string | number; friendly_name?: string }>;
}

/**
 * Calculate light/switch/binary-sensor group state and properties
 *
 * Works for any binary state entities (lights, switches, binary sensors)
 * Aggregates on/off state, brightness (if applicable), and color.
 */
export function calculateLightGroup(
  entities: EntityView[],
  allEntitiesMode = false,
): LightGroupResult {
  if (entities.length === 0) {
    return {
      isGroup: false,
      state: "unknown",
      isOn: false,
      isUnavailable: true,
      brightness: 0,
      brightnessPercent: 0,
      color: "rgb(100, 100, 100)",
      onCount: 0,
      totalCount: 0,
      description: "No entities",
    };
  }

  const isGroup = entities.length > 1;

  if (!isGroup) {
    const entity = entities[0]!;
    const isOn = entity.state === "on";
    const brightness = entity.attributes?.brightness || 0;
    const brightnessPercent = Math.round((brightness / 255) * 100);

    return {
      isGroup: false,
      state: entity.state,
      isOn,
      isUnavailable: entity.state === "unavailable",
      brightness,
      brightnessPercent,
      color: getLightColor(entity),
      onCount: isOn ? 1 : 0,
      totalCount: 1,
      description: isOn ? "On" : "Off",
    };
  }

  // Group logic
  let onCount = 0;
  let offCount = 0;
  let unknownCount = 0;
  let unavailableCount = 0;
  let totalBrightness = 0;
  let brightnessCount = 0;
  const colors: number[][] = [];

  for (const entity of entities) {
    switch (entity.state) {
      case "on":
        onCount++;
        if (entity.attributes?.brightness !== undefined) {
          totalBrightness += entity.attributes.brightness;
          brightnessCount++;
        }
        if (entity.attributes?.rgb_color) {
          colors.push(entity.attributes.rgb_color);
        }
        break;
      case "off":
        offCount++;
        break;
      case "unknown":
        unknownCount++;
        break;
      case "unavailable":
        unavailableCount++;
        break;
    }
  }

  const totalCount = entities.length;
  const allUnavailable = unavailableCount === totalCount;
  const allUnknownOrUnavailable = unknownCount + unavailableCount === totalCount;
  const anyOn = onCount > 0;
  const allOn = onCount === totalCount;
  const allOff = offCount === totalCount;

  // Determine state
  let state: string;
  let isOn: boolean;

  if (allEntitiesMode) {
    if (allUnavailable) {
      state = "unavailable";
      isOn = false;
    } else if (unknownCount > 0 || unavailableCount > 0) {
      state = "unknown";
      isOn = false;
    } else if (offCount > 0) {
      state = "off";
      isOn = false;
    } else {
      state = "on";
      isOn = true;
    }
  } else {
    if (allUnavailable) {
      state = "unavailable";
      isOn = false;
    } else if (allUnknownOrUnavailable) {
      state = "unknown";
      isOn = false;
    } else if (anyOn) {
      state = "on";
      isOn = true;
    } else {
      state = "off";
      isOn = false;
    }
  }

  const brightness = brightnessCount > 0 ? Math.round(totalBrightness / brightnessCount) : 0;
  const brightnessPercent = Math.round((brightness / 255) * 100);

  // Calculate average color
  let color: string;
  if (colors.length > 0) {
    const avgR = Math.round(colors.reduce((sum, c) => sum + c[0]!, 0) / colors.length);
    const avgG = Math.round(colors.reduce((sum, c) => sum + c[1]!, 0) / colors.length);
    const avgB = Math.round(colors.reduce((sum, c) => sum + c[2]!, 0) / colors.length);
    const brightnessMultiplier = brightness / 255;
    color = `rgb(${Math.round(avgR * brightnessMultiplier)}, ${Math.round(avgG * brightnessMultiplier)}, ${Math.round(avgB * brightnessMultiplier)})`;
  } else {
    color = getLightColor(entities[0]!);
  }

  // Generate description
  let description: string;
  if (allOn) {
    description = "All on";
  } else if (allOff) {
    description = "All off";
  } else if (onCount > 0) {
    description = `${onCount} of ${totalCount} on`;
  } else {
    description = "Off";
  }

  return {
    isGroup,
    state,
    isOn,
    isUnavailable: state === "unavailable",
    brightness,
    brightnessPercent,
    color,
    onCount,
    totalCount,
    description,
  };
}

/**
 * Calculate sensor group state and value
 *
 * Aggregates numeric sensor values using various calculation modes.
 */
export function calculateSensorGroup(
  entities: EntityView[],
  groupType: SensorGroupType = "mean",
  ignoreNonNumeric = true,
): SensorGroupResult {
  if (entities.length === 0) {
    return {
      isGroup: false,
      state: "unknown",
      numericValue: null,
      isUnavailable: true,
      description: "No entities",
    };
  }

  const isGroup = entities.length > 1;

  if (!isGroup) {
    const entity = entities[0]!;
    const numericValue = Number.parseFloat(entity.state);

    // Format individual sensor values to prevent overflow
    let formattedState = entity.state;
    if (!Number.isNaN(numericValue)) {
      formattedState = Number.isInteger(numericValue)
        ? numericValue.toString()
        : numericValue.toFixed(1);
    }

    return {
      isGroup: false,
      state: formattedState,
      numericValue: Number.isNaN(numericValue) ? null : numericValue,
      isUnavailable: entity.state === "unavailable",
      unit: entity.unitOfMeasurement ?? undefined,
      description: formattedState,
    };
  }

  // Extract numeric values
  const numericValues: number[] = [];
  const memberValues: Array<{ entityId: string; value: string | number; friendly_name?: string }> =
    [];
  let unavailableCount = 0;
  let unit: string | undefined;

  for (const entity of entities) {
    if (!unit && entity.unitOfMeasurement) {
      unit = entity.unitOfMeasurement;
    }

    if (entity.state === "unavailable") {
      unavailableCount++;
      memberValues.push({
        entityId: entity.id,
        value: "unavailable",
        friendly_name: entity.friendlyName,
      });
      continue;
    }

    const numValue = Number.parseFloat(entity.state);
    if (!isNaN(numValue)) {
      numericValues.push(numValue);
      memberValues.push({
        entityId: entity.id,
        value: numValue,
        friendly_name: entity.friendlyName,
      });
    } else if (!ignoreNonNumeric) {
      // Non-numeric state when not ignoring
      memberValues.push({
        entityId: entity.id,
        value: entity.state,
        friendly_name: entity.friendlyName,
      });
    }
  }

  // Check if unavailable
  const allUnavailable = unavailableCount === entities.length;
  const hasNoNumericValues = numericValues.length === 0;

  if (allUnavailable || hasNoNumericValues) {
    return {
      isGroup,
      state: allUnavailable ? "unavailable" : "unknown",
      numericValue: null,
      isUnavailable: allUnavailable,
      unit,
      description: allUnavailable ? "Unavailable" : "No numeric values",
      memberValues,
    };
  }

  // Calculate based on group type
  let calculatedValue: number;
  let description: string;

  switch (groupType) {
    case "min":
      calculatedValue = Math.min(...numericValues);
      description = "Minimum";
      break;
    case "max":
      calculatedValue = Math.max(...numericValues);
      description = "Maximum";
      break;
    case "mean":
      calculatedValue = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
      description = "Average";
      break;
    case "median": {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      calculatedValue =
        sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
      description = "Median";
      break;
    }
    case "sum":
      calculatedValue = numericValues.reduce((sum, v) => sum + v, 0);
      description = "Sum";
      break;
    case "last":
      calculatedValue = numericValues[numericValues.length - 1]!;
      description = "Latest";
      break;
    case "range":
      calculatedValue = Math.max(...numericValues) - Math.min(...numericValues);
      description = "Range";
      break;
    case "product":
      calculatedValue = numericValues.reduce((prod, v) => prod * v, 1);
      description = "Product";
      break;
    case "std_dev": {
      const mean = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
      const variance =
        numericValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / numericValues.length;
      calculatedValue = Math.sqrt(variance);
      description = "Std Dev";
      break;
    }
    default:
      calculatedValue = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
      description = "Average";
  }

  // Format the value for display - limit to 1 decimal place to prevent overflow
  const formattedValue = Number.isInteger(calculatedValue)
    ? calculatedValue.toString()
    : calculatedValue.toFixed(1);

  return {
    isGroup,
    state: formattedValue,
    numericValue: calculatedValue,
    isUnavailable: false,
    unit,
    description: `${description} of ${numericValues.length}`,
    memberValues,
  };
}

/**
 * Get RGB color for a light entity
 */
function getLightColor(entity: EntityView): string {
  if (entity.state !== "on") return "rgb(100, 100, 100)";

  const brightness = entity.attributes?.brightness ?? 255;
  const brightnessMultiplier = brightness / 255;

  if (entity.attributes?.rgb_color) {
    const [r, g, b] = entity.attributes.rgb_color;
    return `rgb(${Math.round(r * brightnessMultiplier)}, ${Math.round(g * brightnessMultiplier)}, ${Math.round(b * brightnessMultiplier)})`;
  }

  if (entity.attributes?.color_temp) {
    const kelvin = 1000000 / entity.attributes.color_temp;
    const temp = kelvin / 100;
    let r, g, b;

    if (temp <= 66) {
      r = 255;
      g = temp <= 19 ? 0 : 99.4708025861 * Math.log(temp - 10) - 161.1195681661;
      b = temp <= 19 ? 0 : temp <= 66 ? 138.5177312231 * Math.log(temp - 10) - 305.0447927307 : 255;
    } else {
      r = 329.698727446 * (temp - 60) ** -0.1332047592;
      g = 288.1221695283 * (temp - 60) ** -0.0755148492;
      b = 255;
    }

    r = Math.max(0, Math.min(255, r)) * brightnessMultiplier;
    g = Math.max(0, Math.min(255, g)) * brightnessMultiplier;
    b = Math.max(0, Math.min(255, b)) * brightnessMultiplier;

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  return `rgb(${Math.round(255 * brightnessMultiplier)}, ${Math.round(220 * brightnessMultiplier)}, ${Math.round(180 * brightnessMultiplier)})`;
}
