/**
 * Runtime validation schemas, re-exported from the canonical
 * @glasshome/widget-contract package (single source of truth shared by the
 * SDK, the Hub, and Dash). Aliases preserve the SDK's historical export
 * names so consumers don't break.
 */
export {
  capabilitiesSchema,
  capabilityGrantSchema,
  formatSchemaError,
  GridSizeSchema,
  parseGridSize,
  PublishBodySchema,
  PublishConfirmSchema,
  PublishRequestSchema,
  publishManifestSchema,
  serializeGridSize,
  widgetManifestSchema,
  widgetManifestSchema as WidgetManifestSchema,
} from "@glasshome/widget-contract";
export type { CapabilityGrant } from "@glasshome/widget-contract";
