"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/data";
import { accountOperations } from "@/lib/account-management";
export type AccountActionState = {
  ok?: boolean;
  error?: string;
  email?: string;
  password?: string;
  expires_at?: string;
};
async function invokeAdmin(body: object): Promise<AccountActionState> {
  const { db } = await requireViewer(["administrator"]);
  try {
    const { data, error } = await db.functions.invoke("user-administration", {
      body,
    });
    if (error) {
      if ("context" in error && error.context instanceof Response) {
        const result = await error.context.json().catch(() => null);
        if (
          typeof result?.error === "string" &&
          /^GLF_[A-Z_]+$/.test(result.error)
        )
          return { error: result.error };
      }
      return { error: "GLF_SERVICE_UNAVAILABLE" };
    }
    return data?.ok ? data : { error: "GLF_SERVICE_UNAVAILABLE" };
  } catch {
    return { error: "GLF_SERVICE_UNAVAILABLE" };
  }
}
export async function checkAccountService(): Promise<AccountActionState> {
  return invokeAdmin({ operation: "status" });
}
export async function changeAccount(
  _previous: AccountActionState,
  form: FormData,
): Promise<AccountActionState> {
  const { db } = await requireViewer([
    "administrator",
    "grants_manager",
    "sustainability_reviewer",
  ]);
  const parsed = z
    .object({
      id: z.uuid(),
      revision: z.coerce.number().int().min(0),
      operation: z.enum(accountOperations),
      reason: z.string().trim().min(3).max(500),
      confirmed: z.literal("on"),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "GLF_INVALID_OPERATION" };
  const p = parsed.data;
  if (p.operation === "delete") {
    const result = await invokeAdmin({
      operation: "delete",
      id: p.id,
      revision: p.revision,
      reason: p.reason,
      confirmed: true,
    });
    if (result.ok) revalidatePath("/internal/users");
    return result;
  }
  const { error } = await db.rpc("manage_account", {
    target_user: p.id,
    expected_revision: p.revision,
    operation: p.operation,
    reason: p.reason,
  });
  if (error)
    return {
      error:
        error.message.match(/GLF_[A-Z_]+/)?.[0] || "GLF_SERVICE_UNAVAILABLE",
    };
  revalidatePath("/internal/users");
  return { ok: true };
}
export async function createAcademicAccount(
  _previous: AccountActionState,
  form: FormData,
): Promise<AccountActionState> {
  await requireViewer(["administrator"]);
  const parsed = z
    .object({
      email: z.email().max(254),
      full_name: z.string().trim().min(2).max(200),
      confirmed: z.literal("on"),
    })
    .safeParse({
      email: String(form.get("email") || "").trim(),
      full_name: form.get("full_name"),
      confirmed: form.get("confirmed"),
    });
  if (!parsed.success) return { error: "GLF_INVALID_OPERATION" };
  const result = await invokeAdmin({
    operation: "create_academic",
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    confirmed: true,
  });
  if (result.ok) revalidatePath("/internal/users");
  return result;
}
