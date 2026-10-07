"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/data";
import { payloadSchema, emptyPayload } from "@/lib/domain";
export type MutationResult =
  { ok: true; revision: number } | { ok: false; error: string };
function safeError(message: string) {
  const match = message.match(/GLF_[A-Z_]+(?::[a-z0-9_]+)?/);
  return match?.[0] || "GLF_SAVE_FAILED";
}
export async function createDraft(form: FormData) {
  const { db } = await requireViewer(["applicant"]);
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
  const { data, error } = await db.rpc("create_application", {
    call_id: id.data,
  });
  if (error)
    redirect(
      "/applicant?error=" + encodeURIComponent(safeError(error.message)),
    );
  const payload = emptyPayload();
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
    payload: parsed.data,
  });
  if (error) return { ok: false, error: safeError(error.message) };
  revalidatePath("/applicant");
  return { ok: true, revision: data };
}
export async function submitDraft(
  id: string,
  revision: number,
): Promise<MutationResult> {
  const { db } = await requireViewer(["applicant"]);
  if (!z.uuid().safeParse(id).success || !Number.isSafeInteger(revision))
    return { ok: false, error: "GLF_INVALID_PAYLOAD" };
  const { data, error } = await db.rpc("submit_application", {
    application_id: id,
    expected_revision: revision,
  });
  if (error) return { ok: false, error: safeError(error.message) };
  revalidatePath("/applicant");
  revalidatePath("/applicant/" + id);
  return { ok: true, revision: data };
}
