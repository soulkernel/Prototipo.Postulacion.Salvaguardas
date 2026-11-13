"use server";
import { requireViewer } from "@/lib/data";
import { z } from "zod";
import { parseReviewEvidence } from "@/lib/rag-review";
import { revalidatePath } from "next/cache";

export async function saveRagNote(
  _previous: { status: string },
  form: FormData,
) {
  const { db, user } = await requireViewer([
    "sustainability_reviewer",
    "administrator",
  ]);
  const parsed = z
    .object({
      application_id: z.uuid(),
      risk_id: z.uuid(),
      revision: z.coerce.number().int().positive(),
      method: z.enum(["e5", "qwen"]),
      query: z.string().trim().min(3).max(1500),
      observation: z.string().trim().min(1).max(5000),
      evidence: z.string().max(150000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "invalid" };
  try {
    const evidence = JSON.parse(parsed.data.evidence);
    if (!evidence || Array.isArray(evidence) || typeof evidence !== "object")
      return { status: "invalid" };
    const validated = parseReviewEvidence(parsed.data.method, evidence);
    if (
      !validated ||
      (validated.draft_kind && form.get("review_confirmed") !== "on")
    )
      return { status: "invalid" };
    const { error } = await db
      .from("rag_review_notes")
      .insert({ ...parsed.data, evidence: validated, created_by: user.id });
    if (error) return { status: "error" };
    revalidatePath("/internal/evidence");
    return { status: "saved" };
  } catch {
    return { status: "error" };
  }
}
