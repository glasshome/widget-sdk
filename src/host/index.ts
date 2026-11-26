// Host-only surface: event delegation into a closed shadow root. Kept off the
// main SDK entry because it installs document-level listeners at load, code a
// widget bundle must never load, only a host.
export { delegateInside } from "./delegate-inside";
