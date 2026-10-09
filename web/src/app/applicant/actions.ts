"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/data";
import { payloadSchema, emptyPayload, applicantDefaults } from "@/lib/domain";
import { normalizePhone } from "@/lib/phone";
import { synchronizeRisks } from "@/lib/potential-risks";
import { geographyIssues } from "@/lib/geography";
import { hasSummaryParts, summaryText } from "@/lib/summary";
import { words } from "@/lib/domain";
import {
  strategicText,
  alignmentVersion,
  newObjective,
} from "@/lib/strategic-alignment";
import type { SupabaseClient } from "@supabase/supabase-js";
async function validStoredPhone(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("applications")
    .select("payload")
    .eq("id", id)
    .maybeSingle();
  return (
    !error &&
    typeof data?.payload?.concept?.phone === "string" &&
    Boolean(normalizePhone(data.payload.concept.phone))
  );
}
async function validStoredGeography(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("applications")
    .select("payload")
    .eq("id", id)
    .maybeSingle();
  const parsed = payloadSchema.safeParse(data?.payload);
  return (
    !error &&
    parsed.success &&
    geographyIssues(parsed.data.concept).length === 0
  );
}
async function validStoredSummary(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("applications")
    .select("payload,rules_snapshot")
    .eq("id", id)
    .maybeSingle();
  const parsed = payloadSchema.safeParse(data?.payload);
  if (error || !data || !parsed.success) return false;
  const c = parsed.data.concept;
  return (
    (!hasSummaryParts(c.summary_parts) ||
      Object.values(c.summary_parts).every((v) => v.trim())) &&
    words(
      hasSummaryParts(c.summary_parts)
        ? summaryText(c.summary_parts)
        : c.summary,
    ) <= data.rules_snapshot.summary_word_limit
  );
}
export type MutationResult =
  { ok: true; revision: number } | { ok: false; error: string };
function safeError(message: string) {
  const match = message.match(/GLF_[A-Z_]+(?::[a-z0-9_]+)?/);
  return match?.[0] || "GLF_SAVE_FAILED";
}
export async function createDraft(form: FormData) {
  const { db, user } = await requireViewer(["applicant"]);
  const id = z.uuid().safeParse(form.get("call_id"));
  if (!id.success) redirect("/applicant?error=invalid_call");
  const category = z
    .string()
    .min(1)
    .max(200)
    .safeParse(form.get("category_id"));
  const { data: call } = await db
    .from("calls")
    .select("rules")
    .eq("id", id.data)
    .single();
  if (
    !category.success ||
    !call?.rules?.categories?.some(
      (c: { id: string }) => c.id === category.data,
    )
  )
    redirect("/applicant?error=invalid_category");
  const { data: previous, error: previousError } = await db
    .from("applications")
    .select("payload")
    .eq("applicant_id", user.id)
    .neq("payload->concept->>applicant_name", "")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousError) redirect("/applicant?error=GLF_SAVE_FAILED");
  const { data, error } = await db.rpc("create_application", {
    call_id: id.data,
  });
  if (error)
    redirect(
      "/applicant?error=" + encodeURIComponent(safeError(error.message)),
    );
  const payload = emptyPayload();
  payload.concept.risk_register = [];
  payload.concept.strategic_alignment = {
    version: alignmentVersion,
    objectives: [newObjective("general"), newObjective("specific")],
  };
  Object.assign(
    payload.concept,
    applicantDefaults(
      previous?.payload?.concept,
      user.email || "",
      call.rules.applicant_types,
    ),
  );
  payload.concept.category_id = category.data;
  const { error: saveError } = await db.rpc("save_application", {
    application_id: data,
    expected_revision: 0,
    payload,
  });
  if (saveError) redirect("/applicant/" + data);
  redirect("/applicant/" + data);
}
export async function saveDraft(
  id: string,
  revision: number,
  payload: unknown,
): Promise<MutationResult> {
  const { db } = await requireViewer(["applicant"]);
  const parsed = payloadSchema.safeParse(payload);
  if (
    !z.uuid().safeParse(id).success ||
    !Number.isSafeInteger(revision) ||
    !parsed.success
  )
    return { ok: false, error: "GLF_INVALID_PAYLOAD" };
  const { data, error } = await db.rpc("save_application", {
    application_id: id,
    expected_revision: revision,
    payload: {
      ...synchronizeRisks(parsed.data),
      concept: {
        ...synchronizeRisks(parsed.data).concept,
        ...(parsed.data.concept.strategic_alignment
          ? strategicText(parsed.data.concept.strategic_alignment)
          : {}),
        summary: hasSummaryParts(parsed.data.concept.summary_parts)
          ? summaryText(parsed.data.concept.summary_parts)
          : parsed.data.concept.summary,
        phone:
          normalizePhone(parsed.data.concept.phone) ||
          parsed.data.concept.phone,
      },
    },
  });
  if (error) return { ok: false, error: safeError(error.message) };
  revalidatePath("/applicant");
  return { ok: true, revision: data };
}
export async function prepareDocuments(id: string, revision: number) {
  const { db } = await requireViewer(["applicant"]);
  if (!z.uuid().safeParse(id).success || !Number.isSafeInteger(revision))
    return { error: "GLF_INVALID_PAYLOAD" };
  if (!(await validStoredPhone(db, id))) return { error: "GLF_INVALID_PHONE" };
  if (!(await validStoredSummary(db, id)))
    return { error: "GLF_INVALID_SUMMARY" };
  if (!(await validStoredGeography(db, id)))
    return { error: "GLF_INVALID_GEOGRAPHY" };
  const { data, error } = await db.rpc("prepare_application_documents", {
    app_id: id,
    expected_revision: revision,
  });
  return error ? { error: safeError(error.message) } : { id: String(data) };
}
export async function submitDraft(
  id: string,
  revision: number,
): Promise<MutationResult> {
  const { db } = await requireViewer(["applicant"]);
  if (!z.uuid().safeParse(id).success || !Number.isSafeInteger(revision))
    return { ok: false, error: "GLF_INVALID_PAYLOAD" };
  if (!(await validStoredPhone(db, id)))
    return { ok: false, error: "GLF_INVALID_PHONE" };
  if (!(await validStoredSummary(db, id)))
    return { ok: false, error: "GLF_INVALID_SUMMARY" };
  if (!(await validStoredGeography(db, id)))
    return { ok: false, error: "GLF_INVALID_GEOGRAPHY" };
  const { data, error } = await db.rpc("submit_application", {
    application_id: id,
    expected_revision: revision,
  });
  if (error) return { ok: false, error: safeError(error.message) };
  revalidatePath("/applicant");
  revalidatePath("/applicant/" + id);
  return { ok: true, revision: data };
}
