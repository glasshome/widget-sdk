import { z } from "zod";

export const ToneSchema = z.enum([
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
  "accent",
]);

export type Tone = z.infer<typeof ToneSchema>;
