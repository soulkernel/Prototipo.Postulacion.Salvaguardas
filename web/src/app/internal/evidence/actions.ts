"use server";
import { requireViewer, requireRagViewer } from "@/lib/data";
import { embedQuery } from "@/lib/rag";
import { z } from "zod";
import { askQwen } from "@/lib/qwen";
import { qwenResponse, type QwenResponse } from "@/lib/qwen-contract";
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
    const schema =
      parsed.data.method === "qwen"
        ? qwenResponse
        : z.object({
            results: z
              .array(
                z.object({
                  id: z.number().int(),
                  document_name: z.string().max(1000),
                  document_version: z.string().max(1000),
                  locator: z.string().max(1000),
                  content: z.string().max(20000),
                  similarity: z.number().finite(),
                }),
              )
              .max(6),
          });
    if (!schema.safeParse(evidence).success) return { status: "invalid" };
    const { error } = await db
      .from("rag_review_notes")
      .insert({ ...parsed.data, evidence, created_by: user.id });
    if (error) return { status: "error" };
    revalidatePath("/internal/evidence");
    return { status: "saved" };
  } catch {
    return { status: "error" };
  }
}

export type QwenState = {
  status: "idle" | "ok" | "invalid" | "unavailable" | "quota" | "configuration";
  response?: QwenResponse;
  query?: string;
};
export async function consultQwen(
  _previous: QwenState,
  form: FormData,
): Promise<QwenState> {
  const viewer = await requireRagViewer();
  const query = z.string().trim().min(3).max(600).safeParse(form.get("query"));
  if (!query.success) return { status: "invalid" };
  if (viewer.profile.access_kind === "academic") {
    const { data, error } = await viewer.db.rpc("consume_academic_query");
    if (error || !data) return { status: "quota" };
  }
  try {
    return {
      status: "ok",
      response: await askQwen(query.data),
      query: query.data,
    };
  } catch (error) {
    const code = error instanceof Error ? error.message : "unavailable";
    return {
      status:
        code === "quota" || code === "configuration" ? code : "unavailable",
    };
  }
}

export type EvidenceState = {
  query?: string;
  status: "idle" | "ok" | "invalid" | "unavailable" | "quota";
  results: {
    id: number;
    document_name: string;
    document_version: string;
    locator: string;
    content: string;
    similarity: number;
  }[];
};

export async function searchEvidence(
  _previous: EvidenceState,
  form: FormData,
): Promise<EvidenceState> {
  const viewer = await requireRagViewer();
  const { db } = viewer;
  const parsed = z
    .string()
    .trim()
    .min(10)
    .max(1500)
    .safeParse(form.get("query"));
  if (!parsed.success) return { status: "invalid", results: [] };
  if (viewer.profile.access_kind === "academic") {
    const { data, error } = await db.rpc("consume_academic_query");
    if (error || !data) return { status: "quota", results: [] };
  }
  try {
    const embedding = await embedQuery(parsed.data);
    const { data, error } = await db.rpc("match_evidence", {
      query_embedding: JSON.stringify(embedding),
      result_limit: 6,
    });
    if (error) {
      console.error("GLF_EVIDENCE_DATABASE", error.code);
      throw new Error("GLF_RETRIEVAL_FAILED");
    }
    return { status: "ok", results: data || [], query: parsed.data };
  } catch (error) {
    const code = error instanceof Error ? error.message : "GLF_UNKNOWN";
    console.error(
      "GLF_EVIDENCE_FAILURE",
      /^GLF_[A-Z0-9_]+$/.test(code) ? code : "GLF_NETWORK_OR_TIMEOUT",
    );
    return { status: "unavailable", results: [] };
  }
}
