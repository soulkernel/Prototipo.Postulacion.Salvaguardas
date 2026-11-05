"use server";
import { z } from "zod";
import { requireViewer } from "@/lib/data";
import type { SgasDocument } from "@/lib/sgas-experience";
const requestSchema = z.object({
  id: z.uuid(),
  revision: z.number().int().nonnegative().safe(),
  locale: z.enum(["es", "en"]),
});
const documentSchema = z.object({
  id: z.uuid(),
  kind: z.literal("sgas_experience"),
  file_name: z.string(),
  created_at: z.string(),
  generation_source: z.unknown(),
  generated_locale: z.enum(["es", "en"]),
});
export async function finalizeSgasExperience(
  id: string,
  revision: number,
  locale: "es" | "en",
): Promise<{ document: SgasDocument } | { error: string }> {
  const { db } = await requireViewer(["applicant"]);
  const body = requestSchema.safeParse({ id, revision, locale });
  if (!body.success) return { error: "GLF_INVALID_SGAS" };
  try {
    const { data, error } = await db.functions.invoke("sgas-experience", {
      body: body.data,
    });
    if (error) {
      let code = "GLF_SGAS_GENERATION_FAILED";
      if (error.context instanceof Response) {
        try {
          const result = await error.context.json();
          if (typeof result.error === "string")
            code =
              result.error.match(/^GLF_[A-Z_]+(?::[a-z0-9_]+)?$/)?.[0] || code;
        } catch {
          /* Preserve retryable generic message. */
        }
      }
      return { error: code };
    }
    const parsed = documentSchema.safeParse(data);
    return parsed.success
      ? { document: parsed.data }
      : { error: "GLF_SGAS_GENERATION_FAILED" };
  } catch {
    return { error: "GLF_SGAS_GENERATION_FAILED" };
  }
}
