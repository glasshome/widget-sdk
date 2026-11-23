import type { CompiledCatalog } from "@glasshome/widget-contract/i18n-format";

const CHUNKS: Readonly<Record<string, () => Promise<{ default: CompiledCatalog }>>> = {
  fr: () => import("../locales/compiled/fr"),
  es: () => import("../locales/compiled/es"),
  de: () => import("../locales/compiled/de"),
  "en-XA": () => import("../locales/compiled/en-XA"),
};

export async function loadSdkCatalog(language: string): Promise<CompiledCatalog | null> {
  const chunk = CHUNKS[language];
  return chunk ? (await chunk()).default : null;
}
