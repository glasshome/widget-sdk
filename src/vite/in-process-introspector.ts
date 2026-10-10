import { introspectBundle } from "./introspect-core";
import type { Introspector } from "./index";

let reads = 0;

export const inProcessIntrospector: Introspector = async (outFile) => {
  try {
    return { ok: true, value: await introspectBundle(outFile, `t${reads++}`) };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
};
