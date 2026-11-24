import { formatMessage } from "@glasshome/widget-contract/i18n-format";
import { stateText } from "@glasshome/widget-contract/state-texts";
import english from "../../locales/compiled/en";
import type { EntityView } from "../types";
import { ENGLISH, formattingOf, type I18nScope, i18nScope, messageEnv, messageOf } from "./context";

export type StateEntity = Pick<
  EntityView,
  "domain" | "state" | "platform" | "attributes" | "deviceClass"
> & { translationKey?: string | null };

export type TranslateState = (
  entity: StateEntity,
  options?: { attribute?: string; value?: string },
) => string;

const NUMERIC = /^-?\d+(?:\.\d+)?$/;
const SDK_STATES = new Set(["unavailable", "unknown"]);

function rawValue(entity: StateEntity, options: { attribute?: string; value?: string }): string {
  if (options.value !== undefined) return options.value;
  if (options.attribute === undefined) return entity.state;
  const value: unknown = entity.attributes[options.attribute];
  if (typeof value === "string") return value;
  return typeof value === "number" || typeof value === "boolean" ? String(value) : "";
}

export function stateTranslator(scope: I18nScope): TranslateState {
  return (entity, options = {}) => {
    const raw = rawValue(entity, options);
    if (NUMERIC.test(raw)) return raw;
    const current = scope.i18n();
    if (options.attribute === undefined && SDK_STATES.has(raw)) {
      const key = raw === "unknown" ? "sdk.state.unknown" : "sdk.state.unavailable";
      const own = current ? messageOf(current.sdk, key) : undefined;
      const language = own && current ? current.language : ENGLISH;
      return formatMessage(own ?? english[key], {}, messageEnv(language, formattingOf(scope)));
    }
    if (!current?.states) return raw;
    return (
      stateText(current.states, {
        domain: entity.domain,
        state: raw,
        deviceClass: entity.deviceClass ?? undefined,
        platform: entity.platform,
        translationKey: entity.translationKey ?? undefined,
        attribute: options.attribute,
      }) ?? raw
    );
  };
}

/**
 * Home Assistant's words for an entity's state, or for one attribute's value, in the member's language.
 * A number and a state with no text come back as they are.
 */
export function translateState(
  entity: StateEntity,
  options?: { attribute?: string; value?: string },
): string {
  return stateTranslator(i18nScope("translateState"))(entity, options);
}
