/**
 * Host UI primitives, re-exported so the SDK is the single gated door.
 *
 * The host serves `@glasshome/ui/solid` through its import map with no compat
 * check of its own, so a widget importing it directly is exposed to ui drift
 * across the Hub auto-update boundary. Routed through here, the same
 * primitives sit behind `sdkVersion` — the one contract `checkSdkCompat`
 * enforces (same model as the sync-layer hooks).
 *
 * The set is exactly what shipped widgets use; extending it is an additive
 * SDK minor. Direct `@glasshome/ui` imports keep working but are deprecated
 * (`direct-ui-import` in the registry), removed in 2.0.0.
 *
 * `@glasshome/ui/solid` is a vite external of this package: these re-exports
 * resolve to the host-provided singleton at runtime, never a bundled copy.
 */
export {
  Badge,
  Button,
  type Color,
  ColorSlider,
  ColorWheel,
  Input,
  Label,
  parseColor,
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SchemaForm,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from "@glasshome/ui/solid";
