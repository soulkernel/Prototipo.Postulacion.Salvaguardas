import { z } from "zod";
// Explicit scope prevents an empty or malformed selection from becoming a full export.
export const backupSelectionSchema = z.discriminatedUnion("scope", [
  z.strictObject({ scope: z.literal("all") }),
  z.strictObject({ scope: z.literal("call"), call: z.uuid() }),
  z.strictObject({
    scope: z.literal("selected"),
    applications: z
      .array(z.uuid())
      .min(1)
      .max(200)
      .refine((ids) => new Set(ids).size === ids.length),
  }),
]);
