/**
 * Class Name Utility
 *
 * Combines clsx and tailwind-merge for conditional class management.
 * This is a pure function of its inputs -- it does no internal caching.
 *
 * **Memoization guidance for callers:** In hot render paths where inputs
 * change frequently (e.g., reactive signals driving class names), wrap
 * the call in `createMemo` to avoid redundant `twMerge` computation:
 *
 * ```tsx
 * const classes = createMemo(() => cn("base", dynamicSignal()));
 * ```
 *
 * In static JSX expressions with constant strings, no memoization is needed
 * since Solid's fine-grained reactivity only re-evaluates when dependencies change.
 *
 * @example
 * ```tsx
 * <div class={cn(
 *   "base-class",
 *   condition && "conditional-class",
 *   customClass
 * )}>
 * ```
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
