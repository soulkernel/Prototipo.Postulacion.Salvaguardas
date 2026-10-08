"use server";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { callIssues, type CallEditorState } from "@/lib/calls";
import type { Call } from "@/lib/domain";
import { suggestCallCodes } from "@/lib/call-codes";
export async function saveOrPublishCall(
  previous: CallEditorState,
  form: FormData,
): Promise<CallEditorState> {
  const { db } = await requireViewer(["grants_manager", "administrator"]);
  const locale = await getLocale();
  const es = locale === "es";
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const sequence = previous.sequence + 1;
  const id = str("id");
  const revision = Number(str("revision"));
  const values: Record<string, string | string[]> = {};
  for (const [k, v] of form.entries())
    if (!k.startsWith("$ACTION") && typeof v === "string") values[k] = v;
  values.applicant_types = form.getAll("applicant_types").map(String);
  const failed = (error: string): CallEditorState => ({
    ...previous,
    values: str("operation") === "publish" ? previous.values : values,
    error,
    saved: false,
    sequence,
  });
  if (
    id &&
    (!z.uuid().safeParse(id).success ||
      !Number.isInteger(revision) ||
      revision < 0)
  )
    return failed(
      es
        ? "Identificador inválido. Recargue la convocatoria."
        : "Invalid identifier. Reload the call.",
    );
  if (str("operation") === "publish") {
    if (!id || str("confirmed") !== "on")
      return failed(
        es
          ? "Confirme la publicación antes de continuar."
          : "Confirm publication before continuing.",
      );
    const { data: stored, error: readError } = await db
      .from("calls")
      .select("*")
      .eq("id", id)
      .single();
    if (readError || !stored)
      return failed(es ? "No se encontró la convocatoria." : "Call not found.");
    const issues = callIssues(stored as Call, locale, Date.now());
    if (issues.length) return failed(issues.join(" "));
    const { data, error } = await db.rpc("publish_call_reviewed", {
      call_id: id,
      expected_revision: revision,
    });
    if (error)
      return failed(
        es
          ? "No se pudo publicar. Recargue para comprobar si otro usuario modificó la convocatoria."
          : "Publication failed. Reload to check whether another user changed this call.",
      );
    revalidatePath("/internal/calls");
    revalidatePath("/applicant");
    return {
      call: data as Call,
      values: previous.values,
      saved: true,
      sequence,
    };
  }
  const { data: codeRows, error: codeReadError } = await db
    .from("calls")
    .select("id,code");
  if (codeReadError)
    return failed(
      es
        ? "No se pudo comprobar el código. Intente guardar nuevamente."
        : "Could not verify the code. Try saving again.",
    );
  const codeList = (codeRows ?? []) as { id: string; code: string }[];
  const suggestions = suggestCallCodes(
    codeList.map((c) => c.code),
    Date.now(),
  );
  const series = str("code_series") === "test" ? "test" : "official";
  const code = (str("code") || suggestions[series]).toUpperCase();
  values.code = code;
  if (code.length > 200 || /[\u0000-\u001f\u007f]/.test(code))
    return failed(
      es
        ? "El código debe tener hasta 200 caracteres y no incluir caracteres de control."
        : "The code must contain at most 200 characters and no control characters.",
    );
  const duplicate = (suggested: string) => {
    values.code = suggested;
    return failed(
      es
        ? `Ese código ya está utilizado. Se ha propuesto ${suggested}; revise el código y vuelva a guardar. Sus datos se conservaron.`
        : `That code is already in use. ${suggested} has been suggested; review the code and save again. Your entries were preserved.`,
    );
  };
  if (codeList.some((c) => c.id !== id && c.code.trim().toUpperCase() === code))
    return duplicate(suggestions[series]);
  const lines = (k: string) =>
    str(k)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  const phaseEs = lines("phase2_es"),
    phaseEn = lines("phase2_en");
  const details = {
    code,
    title_es: str("title_es"),
    title_en: str("title_en"),
    description_es: str("description_es"),
    description_en: str("description_en"),
    rules_version: str("rules_version"),
    opens_at: str("opens_at") ? str("opens_at") + "-06:00" : null,
    closes_at: str("closes_at") ? str("closes_at") + "-06:00" : null,
    rules: {
      categories: ["small", "medium", "large"]
        .filter((k) => str(k + "_enabled") === "on")
        .map((k) => ({
          id: k,
          label_es: str(k + "_es"),
          label_en: str(k + "_en"),
          min_amount: Number(str(k + "_min")),
          max_amount: str(k + "_max") ? Number(str(k + "_max")) : null,
          max_months: Number(str(k + "_months")),
          cofinance_percent: Number(str(k + "_cofinance")),
        })),
      applicant_types: values.applicant_types,
      summary_word_limit: Number(str("word_limit")),
      max_admin_percent: Number(str("admin_percent")),
      required_attachments: lines("attachments"),
      privacy_es: str("privacy_es"),
      privacy_en: str("privacy_en"),
    },
    phase2_schema: Array.from(
      { length: Math.max(phaseEs.length, phaseEn.length) },
      (_, i) => ({
        id: "field_" + (i + 1),
        label_es: phaseEs[i] ?? "",
        label_en: phaseEn[i] ?? "",
        type: "text",
        required: true,
      }),
    ),
  };
  if (JSON.stringify(details).length > 100000)
    return failed(
      es
        ? "El contenido excede el tamaño permitido."
        : "Content exceeds the allowed size.",
    );
  const { data, error } = await db.rpc("save_call_draft", {
    details,
    call_id: id || null,
    expected_revision: id ? revision : null,
  });
  if (error?.code === "23505") {
    const { data: freshCodes, error: freshError } = await db
      .from("calls")
      .select("code");
    if (!freshError)
      return duplicate(
        suggestCallCodes(
          (freshCodes ?? []).map((c) => c.code as string),
          Date.now(),
        )[series],
      );
  }
  if (error)
    return failed(
      error.code === "23505"
        ? es
          ? "Ya existe una convocatoria con ese código."
          : "A call with that code already exists."
        : error.message.includes("REVISION_CONFLICT")
          ? es
            ? "Otro usuario modificó este borrador. Recargue antes de guardar; sus cambios aún están visibles."
            : "Another user edited this draft. Reload before saving; your changes remain visible."
          : es
            ? "No se pudo guardar. Revise las fechas y los datos ingresados."
            : "Could not save. Review dates and entered data.",
    );
  revalidatePath("/internal/calls");
  if (!id) redirect("/internal/calls?edit=" + (data as Call).id);
  return { call: data as Call, values, saved: true, sequence };
}
