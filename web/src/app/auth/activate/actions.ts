"use server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function activateStaffAccount(form: FormData) {
  const input = z
    .object({
      id: z.uuid(),
      password: z.string().min(12).max(128),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm)
    .safeParse({
      id: form.get("id"),
      password: form.get("password"),
      confirm: form.get("confirm"),
    });
  if (!input.success) return { ok: false, error: "password" };
  const db = await createSupabaseServerClient();
  if (!db) return { ok: false, error: "GLF_INVITATION_CONFIG" };
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return { ok: false, error: "GLF_INVITATION_EXPIRED" };
  const { data, error: checkError } = await db.rpc("get_staff_activation", {
    invitation_id: input.data.id,
  });
  if (
    checkError ||
    !data ||
    data.status !== "sent" ||
    Date.parse(data.expires_at) <= Date.now()
  )
    return { ok: false, error: "GLF_INVITATION_EXPIRED" };
  if (data.email !== user.email?.toLowerCase())
    return { ok: false, error: "GLF_INVITATION_RECIPIENT" };
  const { error: passwordError } = await db.auth.updateUser({
    password: input.data.password,
  });
  if (passwordError) return { ok: false, error: "password" };
  const { error: activationError } = await db.rpc("accept_staff_invitation", {
    invitation_id: input.data.id,
  });
  if (activationError)
    return {
      ok: false,
      error:
        activationError.message.match(/GLF_[A-Z_]+/)?.[0] ||
        "GLF_INVITATION_FAILED",
    };
  return { ok: true };
}
