"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/data";
import { z } from "zod";
function value(f: FormData, k: string) {
  return String(f.get(k) || "").trim();
}
function fail(path: string, message: string): never {
  const code = message.match(/GLF_[A-Z_]+/)?.[0] || "GLF_OPERATION_FAILED";
  redirect(path + "?error=" + code);
}
export async function createCall(form: FormData) {
  const { db } = await requireViewer(["grants_manager", "administrator"]);
  const categories = ["small", "medium", "large"]
    .filter((k) => form.get(k + "_enabled") === "on")
    .map((k) => ({
      id: k,
      label_es: value(form, k + "_es"),
      label_en: value(form, k + "_en"),
      min_amount: Number(form.get(k + "_min")),
      max_amount: value(form, k + "_max") ? Number(form.get(k + "_max")) : null,
      max_months: Number(form.get(k + "_months")),
      cofinance_percent: Number(form.get(k + "_cofinance")),
    }));
  const phase2es = value(form, "phase2_es")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const phase2en = value(form, "phase2_en")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (phase2es.length !== phase2en.length)
    fail("/internal/calls", "GLF_INVALID_PHASE2_FIELDS");
  const details = {
    code: value(form, "code"),
    title_es: value(form, "title_es"),
    title_en: value(form, "title_en"),
    description_es: value(form, "description_es"),
    description_en: value(form, "description_en"),
    opens_at: value(form, "opens_at") + "-06:00",
    closes_at: value(form, "closes_at") + "-06:00",
    rules_version: value(form, "rules_version"),
    rules: {
      categories,
      applicant_types: form.getAll("applicant_types"),
      summary_word_limit: Number(form.get("word_limit")),
      max_admin_percent: Number(form.get("admin_percent")),
      required_attachments: value(form, "attachments")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      privacy_es: value(form, "privacy_es"),
      privacy_en: value(form, "privacy_en"),
    },
    phase2_schema: phase2es.map((label, i) => ({
      id: "field_" + (i + 1),
      label_es: label,
      label_en: phase2en[i],
      type: "text",
      required: true,
    })),
  };
  const { error } = await db.rpc("create_call", { details });
  if (error) fail("/internal/calls", error.message);
  revalidatePath("/internal/calls");
  redirect("/internal/calls?saved=1");
}
export async function publishCall(form: FormData) {
  const { db } = await requireViewer(["grants_manager", "administrator"]);
  const id = z.uuid().parse(form.get("id"));
  const { error } = await db.rpc("publish_call", { call_id: id });
  if (error) fail("/internal/calls", error.message);
  revalidatePath("/");
  redirect("/internal/calls");
}
export async function recordReview(form: FormData) {
  const { db, profile } = await requireViewer([
    "grants_manager",
    "sustainability_reviewer",
    "project_coordinator",
  ]);
  const id = z.uuid().parse(form.get("id"));
  const review_type =
    profile.role === "sustainability_reviewer"
      ? "safeguards"
      : profile.role === "grants_manager"
        ? "grants"
        : "coordination";
  const { error } = await db.rpc("record_review", {
    application_id: id,
    expected_revision: Number(form.get("revision")),
    review_type,
    findings: value(form, "findings"),
    recommendation: value(form, "recommendation"),
    category:
      review_type === "safeguards" ? value(form, "category") || null : null,
  });
  if (error) fail("/internal/applications/" + id, error.message);
  revalidatePath("/internal/applications/" + id);
  redirect("/internal/applications/" + id + "?saved=1");
}
export async function reopenApplication(form: FormData) {
  const { db } = await requireViewer(["grants_manager"]);
  const id = z.uuid().parse(form.get("id"));
  const { error } = await db.rpc("reopen_application", {
    application_id: id,
    deadline: value(form, "deadline") + "-06:00",
    reason: value(form, "reason"),
  });
  if (error) fail("/internal/applications/" + id, error.message);
  redirect("/internal/applications/" + id + "?saved=1");
}
export async function recordDecision(form: FormData) {
  const { db } = await requireViewer(["committee_member"]);
  const id = z.uuid().parse(form.get("id"));
  const { error } = await db.rpc("record_decision", {
    application_id: id,
    expected_revision: Number(form.get("revision")),
    body: value(form, "body"),
    decision: value(form, "decision"),
    reference: value(form, "reference"),
    rationale: value(form, "rationale"),
    invitation_deadline: value(form, "deadline")
      ? value(form, "deadline") + "-06:00"
      : null,
    approved_amount: value(form, "approved_amount")
      ? Number(form.get("approved_amount"))
      : null,
  });
  if (error) fail("/internal/applications/" + id, error.message);
  redirect("/internal/applications/" + id + "?saved=1");
}
export async function recordAgreement(form: FormData) {
  const { db } = await requireViewer(["grants_manager"]);
  const id = z.uuid().parse(form.get("id"));
  const { error } = await db.rpc("record_agreement", {
    app_id: id,
    expected_revision: Number(form.get("revision")),
    document_id: z.uuid().parse(form.get("document_id")),
    reference: value(form, "reference"),
    amount: Number(form.get("amount")),
    cofinance: Number(form.get("cofinance")),
    glf_date: value(form, "glf_date"),
    applicant_date: value(form, "applicant_date"),
  });
  if (error) fail("/internal/applications/" + id, error.message);
  redirect("/internal/applications/" + id + "?saved=1");
}
