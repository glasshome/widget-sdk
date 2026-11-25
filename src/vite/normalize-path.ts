import { sep } from "node:path";

export function normalizePath(p: string): string {
  return sep === "\\" ? p.split(sep).join("/") : p;
}
