"use server";
import { requireRagViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { projectRisks, type RagProject } from "@/lib/rag-context";
import type { Payload } from "@/lib/domain";
import type { RagNote } from "@/components/rag-workspace";
import { z } from "zod";

export async function findRagProjects(input: { call: string; search: string; page: number }) {
  const { db } = await requireRagViewer();
  const page = Math.max(0, Math.min(10000, Math.trunc(Number(input.page) || 0)));
  const search = String(input.search || "").slice(0, 100).replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  let query = db.from("latest_submitted_applications")
    .select("id,call_id,reference_code,title,revision,stage", { count: "exact" });
  if (input.call && z.uuid().safeParse(input.call).success) query = query.eq("call_id", input.call);
  if (search) query = query.or(`title.ilike.%${search}%,reference_code.ilike.%${search}%`);
  const { data, error, count } = await query.order("reference_code").order("id").range(page * 20, page * 20 + 19);
  return {
    error: Boolean(error), count: count || 0,
    projects: (data || []).map((v): RagProject => ({ id: v.id, callId: v.call_id,
      reference: v.reference_code, title: v.title || v.reference_code, revision: v.revision, stage: v.stage, risks: [] })),
  };
}

export async function loadRagProject(id: string): Promise<{ project: RagProject | null; notes: RagNote[]; error: boolean }> {
  const { db } = await requireRagViewer();
  if (!z.uuid().safeParse(id).success) return { project: null, notes: [], error: true };
  const locale = await getLocale();
  const [context, notes] = await Promise.all([
    db.from("latest_submitted_applications").select("id,call_id,reference_code,title,revision,stage,payload").eq("id", id).maybeSingle(),
    db.from("rag_review_notes").select("id,application_id,risk_id,revision,method,query,observation,created_at,evidence")
      .eq("application_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  const v = context.data;
  if (context.error || notes.error || !v) return { project: null, notes: [], error: true };
  return { error: false, notes: notes.data || [], project: {
    id: v.id, callId: v.call_id, reference: v.reference_code, title: v.title || v.reference_code,
    revision: v.revision, stage: v.stage, risks: projectRisks(v.payload as Payload, locale),
  } };
}
