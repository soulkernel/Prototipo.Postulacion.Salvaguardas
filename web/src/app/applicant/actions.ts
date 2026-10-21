"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  attachmentRequirementsSchema,
  applicationAttachments,
} from "@/lib/attachment-requirements";
import { validateRequiredDocuments } from "@/lib/attachment-validation";
import { requireViewer } from "@/lib/data";
import {
  payloadSchema,
  emptyPayload,
  applicantDefaults,
  individualGrantIssue,
} from "@/lib/domain";
import { normalizePhone } from "@/lib/phone";
import {
  partnerIssues,
  partnerText,
  partnerPatch,
  partnerRecords,
} from "@/lib/partners";
import { activityPlanningIssues } from "@/lib/activity-planning";
import { resultIssues, resultText } from "@/lib/project-results";
import { monitoringIssues } from "@/lib/monitoring-plan";
import { sustainabilityIssues } from "@/lib/sustainability-plan";
import { summaryBudgetIssues } from "@/lib/summary-budget";
import { synchronizeRisks } from "@/lib/potential-risks";
import { geographyIssues, organizationProvinceIssue } from "@/lib/geography";
import { projectSummary } from "@/lib/summary";
import { words } from "@/lib/domain";
import { detectPdfSignature } from "@/lib/pdf-signature";
import { submissionError } from "@/lib/submission-error";
import { applicationTopicIssue } from "@/lib/call-themes";
import {
  strategicText,
  currentAlignmentVersion,
  newObjective,
} from "@/lib/strategic-alignment";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  removePartnerAndFiles,
  type PartnerRemovalResult,
} from "@/lib/partner-removal";
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
async function storedGrantEligibilityError(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("applications")
    .select("payload,rules_snapshot")
    .eq("id", id)
    .maybeSingle();
  const parsed = payloadSchema.safeParse(data?.payload);
  if (error || !parsed.success) return "GLF_INVALID_PAYLOAD";
  if (organizationProvinceIssue(parsed.data.concept))
    return "GLF_ORGANIZATION_PROVINCE";
  if (individualGrantIssue(parsed.data.concept))
    return "GLF_INDIVIDUAL_SMALL_ONLY";
  if (!data?.rules_snapshot) return "GLF_INVALID_PAYLOAD";
  return applicationTopicIssue(
    parsed.data.concept.project_type,
    data.rules_snapshot,
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
async function validStoredPartners(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("applications")
    .select("payload")
    .eq("id", id)
    .maybeSingle();
  const parsed = payloadSchema.safeParse(data?.payload);
  return (
    !error && parsed.success && partnerIssues(parsed.data.concept).length === 0
  );
}
async function storedPlanningError(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("applications")
    .select("payload,stage")
    .eq("id", id)
    .maybeSingle();
  const parsed = payloadSchema.safeParse(data?.payload);
  if (error || !data || !parsed.success || ![1, 2].includes(data.stage))
    return "GLF_INVALID_PAYLOAD";
  if (activityPlanningIssues(parsed.data).length)
    return "GLF_REQUIRED:activities";
  const issues = [
    ...(data.stage === 1 ? summaryBudgetIssues(parsed.data) : []),
    ...resultIssues(parsed.data.concept, data.stage),
    ...monitoringIssues(parsed.data),
    ...sustainabilityIssues(parsed.data),
  ];
  return issues.length ? `GLF_REQUIRED:${issues[0]}` : null;
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
  const summary = projectSummary(c);
  return (
    Boolean(summary.trim()) &&
    words(summary) <= data.rules_snapshot.summary_word_limit
  );
}
export type MutationResult =
  | { ok: true; revision: number; receiptId?: string }
  | { ok: false; error: string };
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
  payload.concept.project_results = [];
  payload.concept.monitoring_plan = [];
  payload.concept.sustainability_plan = [];
  payload.concept.risk_register = [];
  payload.concept.strategic_alignment = {
    version: currentAlignmentVersion,
    objectives: [
      newObjective("general", currentAlignmentVersion),
      newObjective("specific", currentAlignmentVersion),
    ],
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
  if (organizationProvinceIssue(parsed.data.concept))
    return { ok: false, error: "GLF_ORGANIZATION_PROVINCE" };
  const { data: stored, error: readError } = await db
    .from("applications")
    .select("stage")
    .eq("id", id)
    .maybeSingle();
  if (readError || !stored || ![1, 2].includes(stored.stage))
    return { ok: false, error: "GLF_INVALID_PAYLOAD" };
  const { data, error } = await db.rpc("save_application", {
    application_id: id,
    expected_revision: revision,
    payload: {
      ...synchronizeRisks(parsed.data),
      concept: {
        ...synchronizeRisks(parsed.data).concept,
        results: resultText(parsed.data.concept, "es", stored.stage),
        ...(parsed.data.concept.associated_organizations
          ? {
              partners: partnerText(
                parsed.data.concept.associated_organizations,
              ),
            }
          : {}),
        ...(parsed.data.concept.partner_organizations
          ? partnerPatch(parsed.data.concept.partner_organizations)
          : {}),
        ...(parsed.data.concept.strategic_alignment
          ? strategicText(parsed.data.concept.strategic_alignment)
          : {}),
        summary: projectSummary(parsed.data.concept),
        phone:
          normalizePhone(parsed.data.concept.phone) ||
          parsed.data.concept.phone,
      },
    },
  });
  if (error) return { ok: false, error: safeError(error.message) };
  revalidatePath("/applicant/applications");
  return { ok: true, revision: data };
}
export async function deleteDraft(
  id: string,
  revision: number,
): Promise<{ ok: boolean; error?: string }> {
  const { db } = await requireViewer(["applicant"]);
  if (!z.uuid().safeParse(id).success || !Number.isSafeInteger(revision))
    return { ok: false, error: "GLF_INVALID_PAYLOAD" };
  const { data: paths, error: beginError } = await db.rpc(
    "begin_delete_draft",
    { app_id: id, expected_revision: revision },
  );
  if (beginError) return { ok: false, error: safeError(beginError.message) };
  if (Array.isArray(paths))
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await db.storage
        .from("application-files")
        .remove(paths.slice(i, i + 100));
      if (error) return { ok: false, error: "GLF_DELETE_FILES_PENDING" };
    }
  const { error } = await db.rpc("finish_delete_draft", { app_id: id });
  if (error) return { ok: false, error: safeError(error.message) };
  revalidatePath("/applicant/applications");
  revalidatePath("/applicant");
  return { ok: true };
}
export async function removePartner(
  id: string,
  revision: number,
  partnerId: string,
): Promise<PartnerRemovalResult> {
  const { db } = await requireViewer(["applicant"]);
  if (
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(partnerId).success ||
    !Number.isSafeInteger(revision) ||
    revision < 0
  )
    return { ok: false, error: "GLF_INVALID_PAYLOAD", pending: false };
  const result = await removePartnerAndFiles(db, id, revision, partnerId);
  if (result.ok) revalidatePath("/applicant/applications");
  return result;
}
export async function prepareDocuments(
  id: string,
  revision: number,
): Promise<{ id?: string; created_at?: string; error?: string }> {
  const { db } = await requireViewer(["applicant"]);
  if (!z.uuid().safeParse(id).success || !Number.isSafeInteger(revision))
    return { error: "GLF_INVALID_PAYLOAD" };
  const eligibilityError = await storedGrantEligibilityError(db, id);
  if (eligibilityError) return { error: eligibilityError };
  if (!(await validStoredPartners(db, id)))
    return { error: "GLF_REQUIRED:partners" };
  const planningError = await storedPlanningError(db, id);
  if (planningError) return { error: planningError };
  if (!(await validStoredPhone(db, id))) return { error: "GLF_INVALID_PHONE" };
  if (!(await validStoredSummary(db, id)))
    return { error: "GLF_INVALID_SUMMARY" };
  if (!(await validStoredGeography(db, id)))
    return { error: "GLF_INVALID_GEOGRAPHY" };
  const { data, error } = await db.rpc("prepare_application_documents", {
    app_id: id,
    expected_revision: revision,
  });
  if (error) return { error: safeError(error.message) };
  const { data: prepared, error: readError } = await db
    .from("prepared_documents")
    .select("id,created_at")
    .eq("id", String(data))
    .single();
  return readError || !prepared
    ? { error: "GLF_PREPARE_DOCUMENTS_REQUIRED" }
    : prepared;
}
export async function submitDraft(
  id: string,
  revision: number,
): Promise<MutationResult> {
  const { db } = await requireViewer(["applicant"]);
  if (!z.uuid().safeParse(id).success || !Number.isSafeInteger(revision))
    return { ok: false, error: "GLF_INVALID_PAYLOAD" };
  const eligibilityError = await storedGrantEligibilityError(db, id);
  if (eligibilityError) return { ok: false, error: eligibilityError };
  if (!(await validStoredPartners(db, id)))
    return { ok: false, error: "GLF_REQUIRED:partners" };
  const planningError = await storedPlanningError(db, id);
  if (planningError) return { ok: false, error: planningError };
  if (!(await validStoredPhone(db, id)))
    return { ok: false, error: "GLF_INVALID_PHONE" };
  if (!(await validStoredSummary(db, id)))
    return { ok: false, error: "GLF_INVALID_SUMMARY" };
  if (!(await validStoredGeography(db, id)))
    return { ok: false, error: "GLF_INVALID_GEOGRAPHY" };
  const { data: attachmentApp, error: attachmentReadError } = await db
    .from("applications")
    .select("rules_snapshot,stage,payload")
    .eq("id", id)
    .maybeSingle();
  if (attachmentReadError || !attachmentApp)
    return { ok: false, error: "GLF_ATTACHMENT_UNREADABLE" };
  if (
    partnerRecords(attachmentApp.payload.concept).some(
      (p) => p.name.trim() && !p.id,
    )
  )
    return { ok: false, error: "GLF_PARTNER_LINK_REQUIRED" };
  {
    if (
      attachmentApp.rules_snapshot.attachment_requirements !== undefined &&
      !attachmentRequirementsSchema.safeParse(
        attachmentApp.rules_snapshot.attachment_requirements,
      ).success
    )
      return { ok: false, error: "GLF_ATTACHMENT_UNREADABLE" };
    const requirements = applicationAttachments(
      attachmentApp.rules_snapshot,
      attachmentApp.payload.concept,
    ).filter(
      (r) =>
        attachmentApp.stage !== 1 ||
        !["concept_signed", "matrix_signed"].includes(r.id),
    );
    if (requirements.length) {
      const { data: files, error: filesError } = await db
        .from("application_documents")
        .select("kind,file_name,storage_path")
        .eq("application_id", id)
        .in(
          "kind",
          requirements.map((r) => r.id),
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      if (filesError) return { ok: false, error: "GLF_ATTACHMENT_UNREADABLE" };
      const issue = await validateRequiredDocuments(
        requirements,
        files ?? [],
        async (path) => {
          const { data, error } = await db.storage
            .from("application-files")
            .download(path);
          if (error || !data) throw new Error("Unavailable attachment");
          return new Uint8Array(await data.arrayBuffer());
        },
      );
      if (issue) return { ok: false, error: issue };
    }
  }
  const { data: signatureApp } = await db
    .from("applications")
    .select("stage,revision")
    .eq("id", id)
    .maybeSingle();
  if (signatureApp?.stage === 1) {
    if (signatureApp.revision !== revision)
      return { ok: false, error: "GLF_VERSION_CONFLICT" };
    const { data: signedFiles, error: fileError } = await db
      .from("application_documents")
      .select("kind,storage_path,created_at")
      .eq("application_id", id)
      .in("kind", ["concept_signed", "matrix_signed"])
      .order("created_at", { ascending: false });
    if (fileError) return { ok: false, error: "GLF_SIGNATURE_UNREADABLE" };
    for (const kind of ["concept_signed", "matrix_signed"]) {
      const file = signedFiles?.find((f) => f.kind === kind);
      if (!file)
        return {
          ok: false,
          error:
            kind === "concept_signed"
              ? "GLF_SIGNED_CONCEPT_REQUIRED"
              : "GLF_SIGNED_MATRIX_REQUIRED",
        };
      const { data: content, error: downloadError } = await db.storage
        .from("application-files")
        .download(file.storage_path);
      if (downloadError || !content)
        return { ok: false, error: "GLF_SIGNATURE_UNREADABLE" };
      const detected = await detectPdfSignature(
        new Uint8Array(await content.arrayBuffer()),
      );
      if (detected !== "detected")
        return {
          ok: false,
          error:
            detected === "missing"
              ? "GLF_SIGNATURE_MISSING"
              : "GLF_SIGNATURE_UNREADABLE",
        };
    }
  }
  const { data, error } = await db.rpc("submit_application", {
    application_id: id,
    expected_revision: revision,
  });
  if (error) {
    console.error("GLF submission rejected", {
      code: error.code,
      reason: submissionError(error.message),
    });
    return { ok: false, error: submissionError(error.message) };
  }
  revalidatePath("/applicant");
  revalidatePath("/applicant/" + id);
  revalidatePath("/applicant/applications");
  const { data: submitted } = await db
    .from("application_versions")
    .select("id")
    .eq("application_id", id)
    .eq("revision", data)
    .maybeSingle();
  return { ok: true, revision: data, receiptId: submitted?.id };
}
