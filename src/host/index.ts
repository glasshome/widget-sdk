// Host-only surface: mounting a widget into a closed shadow root. Kept off the
// main SDK entry because it pulls solid-js/web `render` and installs a
// document-level MutationObserver — code a widget bundle must never load, only
// a host (dash, the preview harness, the hub render worker).
export {
  instantiateWidget,
  type MountOptions,
  type WidgetInstanceHandle,
} from "./instantiate-widget";
