"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/domain";
import { cookies } from "next/headers";
import {
  rememberSeconds,
  sessionPreferenceCookie,
  sessionCookieOptions,
} from "@/lib/session-preference";
async function writeSessionPreference(remember: boolean) {
  const store = await cookies();
  const preference = remember
    ? String(Date.now() + rememberSeconds * 1000)
    : "session";
  store.set(sessionPreferenceCookie, preference, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? rememberSeconds : undefined,
  });
  for (const c of store.getAll())
    if (/^sb-.*-auth-token(?:\.\d+)?$/.test(c.name))
      store.set(
        c.name,
        c.value,
        sessionCookieOptions(
          {
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          },
          preference,
        ),
      );
}
export async function rememberVerifiedSession(remember: boolean) {
  const db = await createSupabaseServerClient();
  if (!db) return { ok: false };
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return { ok: false };
  const { data } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel !== "aal2") return { ok: false };
  await writeSessionPreference(remember);
  return { ok: true };
}
function siteUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site && process.env.NODE_ENV === "production")
    throw new Error("SITE_URL is required");
  return site || "http://localhost:3000";
}
export async function signIn(form: FormData) {
  const email = z.email().safeParse(String(form.get("email") || "").trim());
  const password = String(form.get("password") || "");
  if (!email.success || !password || password.length > 256)
    redirect("/login?error=credentials");
  await writeSessionPreference(form.get("remember") === "on");
  const db = await createSupabaseServerClient();
  if (!db) redirect("/login?error=config");
  const { error } = await db.auth.signInWithPassword({
    email: email.data,
    password,
  });
  if (error)
    redirect(
      error.code === "email_not_confirmed"
        ? "/login?error=email_not_confirmed"
        : "/login?error=credentials",
    );
  const {
    data: { user },
  } = await db.auth.getUser();
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user?.id || "")
    .maybeSingle();
  redirect(
    safeReturnPath(
      form.get("next"),
      profile?.role && profile.role !== "applicant"
        ? "/internal"
        : "/applicant",
    ),
  );
}
export async function signUp(form: FormData) {
  const db = await createSupabaseServerClient();
  if (!db) redirect("/register?error=config");
  const parsed = z
    .object({
      email: z.email(),
      name: z.string().trim().min(2).max(200),
      password: z.string().min(12).max(128),
    })
    .safeParse({
      email: String(form.get("email") || "").trim(),
      name: form.get("full_name"),
      password: form.get("password"),
    });
  if (!parsed.success) redirect("/register?error=required");
  const { error } = await db.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      // Supabase verifies the email before returning here. Sign-in is explicit,
      // so confirmation also works on another device without a PKCE verifier.
      emailRedirectTo: siteUrl() + "/login?confirmation=return",
    },
  });
  if (error) redirect("/register?error=signup");
  redirect("/register?sent=1");
}
export async function resendConfirmation(form: FormData) {
  const db = await createSupabaseServerClient();
  if (!db) redirect("/login?error=config");
  const email = z.email().safeParse(String(form.get("email") || "").trim());
  if (!email.success) redirect("/login?error=required");
  const { error } = await db.auth.resend({
    type: "signup",
    email: email.data,
    options: { emailRedirectTo: siteUrl() + "/login?confirmation=return" },
  });
  if (error) redirect("/login?error=confirmation_send");
  redirect("/login?sent=1");
}
export async function signOut() {
  const db = await createSupabaseServerClient();
  if (db) await db.auth.signOut({ scope: "local" });
  (await cookies()).delete(sessionPreferenceCookie);
  redirect("/login");
}
export async function requestPasswordReset(form: FormData) {
  const db = await createSupabaseServerClient();
  if (!db) redirect("/login?error=config");
  const email = z.email().safeParse(String(form.get("email") || "").trim());
  if (email.success)
    await db.auth.resetPasswordForEmail(email.data, {
      redirectTo: siteUrl() + "/auth/callback?next=/security/password",
    });
  redirect("/login?reset=1");
}
export async function updatePassword(form: FormData) {
  const db = await createSupabaseServerClient();
  const password = String(form.get("password") || "");
  if (!db) redirect("/login");
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  if (password.length < 12 || password.length > 128)
    redirect("/security/password?error=required");
  const { error } = await db.auth.updateUser({ password });
  if (error) redirect("/security/password?error=required");
  await db.auth.signOut({ scope: "global" });
  redirect("/login?updated=1");
}
