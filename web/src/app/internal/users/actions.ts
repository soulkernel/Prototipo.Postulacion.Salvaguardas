"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/data";
import { invitationInput, invitationRoles } from "@/lib/staff-invitations";
const allowed = [
  "administrator",
  "grants_manager",
  "sustainability_reviewer",
] as const;
const errorCode = (message: string) =>
  message.match(/GLF_[A-Z_]+/)?.[0] || "GLF_INVITATION_FAILED";

export async function prepareStaffInvitation(form: FormData) {
  const { db, profile } = await requireViewer(allowed);
  const input = invitationInput.safeParse({
    email: String(form.get("email") || "").trim(),
    full_name: form.get("full_name"),
    role: form.get("role"),
    scope: form.get("scope") || "none",
  });
  if (!input.success) return { ok: false, error: "GLF_INVALID_INVITATION" };
  if (
    !invitationRoles(profile.role, profile.user_admin_scope).includes(
      input.data.role,
    ) ||
    (profile.role !== "administrator" && input.data.scope !== "none")
  )
    return { ok: false, error: "GLF_FORBIDDEN" };
  const { data, error } = await db.rpc("prepare_staff_invitation", {
    contact_email: input.data.email,
    contact_name: input.data.full_name,
    desired_role: input.data.role,
    desired_scope: input.data.scope,
  });
  if (error) return { ok: false, error: errorCode(error.message) };
  revalidatePath("/internal/users");
  return { ok: true, id: data as string };
}
export async function sendStaffInvitation(form: FormData) {
  const { db, profile } = await requireViewer(allowed);
  if (!invitationRoles(profile.role, profile.user_admin_scope).length)
    return { ok: false, error: "GLF_FORBIDDEN" };
  const input = z
    .object({
      id: z.uuid(),
      updated_at: z.iso.datetime({ offset: true }),
      confirmed: z.literal("on"),
    })
    .safeParse({
      id: form.get("id"),
      updated_at: form.get("updated_at"),
      confirmed: form.get("confirmed"),
    });
  if (!input.success) return { ok: false, error: "GLF_INVALID_INVITATION" };
  try {
    const { data, error } = await db.functions.invoke("staff-invitations", {
      body: { id: input.data.id, updated_at: input.data.updated_at },
    });
    revalidatePath("/internal/users");
    if (error) {
      let code = "GLF_INVITATION_CONFIG";
      if ("context" in error && error.context instanceof Response) {
        const body = await error.context.json().catch(() => null);
        if (typeof body?.error === "string") code = body.error;
      }
      return { ok: false, error: code };
    }
    return data?.ok
      ? { ok: true }
      : { ok: false, error: data?.error || "GLF_INVITATION_FAILED" };
  } catch {
    return { ok: false, error: "GLF_INVITATION_CONFIG" };
  }
}
export async function cancelStaffInvitation(form: FormData) {
  const { db } = await requireViewer(allowed);
  const input = z
    .object({
      id: z.uuid(),
      updated_at: z.iso.datetime({ offset: true }),
      confirmed: z.literal("on"),
    })
    .safeParse({
      id: form.get("id"),
      updated_at: form.get("updated_at"),
      confirmed: form.get("confirmed"),
    });
  if (!input.success) return { ok: false, error: "GLF_INVALID_INVITATION" };
  const { error } = await db.rpc("cancel_staff_invitation", {
    invitation_id: input.data.id,
    expected_updated_at: input.data.updated_at,
  });
  if (error) return { ok: false, error: errorCode(error.message) };
  revalidatePath("/internal/users");
  return { ok: true };
}

export async function checkStaffInvitationService() {
  const { db, profile } = await requireViewer(allowed);
  if (!invitationRoles(profile.role, profile.user_admin_scope).length)
    return { ok: false, error: "GLF_FORBIDDEN" };
  try {
    const { data, error } = await db.functions.invoke("staff-invitations", {
      body: { operation: "status" },
    });
    return !error && data?.ok
      ? { ok: true }
      : { ok: false, error: "GLF_INVITATION_CONFIG" };
  } catch {
    return { ok: false, error: "GLF_INVITATION_CONFIG" };
  }
}
