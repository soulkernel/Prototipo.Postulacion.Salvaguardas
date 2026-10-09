"use server";
import { requireViewer } from "@/lib/data";
import { embedQuery } from "@/lib/rag";
import { z } from "zod";

export type EvidenceState = {
  status: "idle" | "ok" | "invalid" | "unavailable";
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
  const { db } = await requireViewer([
    "sustainability_reviewer",
    "administrator",
  ]);
  const parsed = z
    .string()
    .trim()
    .min(10)
    .max(1500)
    .safeParse(form.get("query"));
  if (!parsed.success) return { status: "invalid", results: [] };
  try {
    const embedding = await embedQuery(parsed.data);
    const { data, error } = await db.rpc("match_evidence", {
      query_embedding: JSON.stringify(embedding),
      result_limit: 6,
    });
    if (error) throw new Error("GLF_RETRIEVAL_FAILED");
    return { status: "ok", results: data || [] };
  } catch {
    return { status: "unavailable", results: [] };
  }
}
