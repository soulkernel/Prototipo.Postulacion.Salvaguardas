"use server";
import { requireViewer } from "@/lib/data";
import { embedQuery } from "@/lib/rag";
import { z } from "zod";
import { askQwen } from "@/lib/qwen";
import type { QwenResponse } from "@/lib/qwen-contract";

export type QwenState = {
  status: "idle" | "ok" | "invalid" | "unavailable" | "quota" | "configuration";
  response?: QwenResponse;
};
export async function consultQwen(
  _previous: QwenState,
  form: FormData,
): Promise<QwenState> {
  await requireViewer(["sustainability_reviewer", "administrator"]);
  const query = z.string().trim().min(3).max(600).safeParse(form.get("query"));
  if (!query.success) return { status: "invalid" };
  try {
    return { status: "ok", response: await askQwen(query.data) };
  } catch (error) {
    const code = error instanceof Error ? error.message : "unavailable";
    return {
      status:
        code === "quota" || code === "configuration" ? code : "unavailable",
    };
  }
}

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
    if (error) {
      console.error("GLF_EVIDENCE_DATABASE", error.code);
      throw new Error("GLF_RETRIEVAL_FAILED");
    }
    return { status: "ok", results: data || [] };
  } catch (error) {
    const code = error instanceof Error ? error.message : "GLF_UNKNOWN";
    console.error(
      "GLF_EVIDENCE_FAILURE",
      /^GLF_[A-Z0-9_]+$/.test(code) ? code : "GLF_NETWORK_OR_TIMEOUT",
    );
    return { status: "unavailable", results: [] };
  }
}
