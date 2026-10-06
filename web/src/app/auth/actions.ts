"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/domain";
function siteUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site && process.env.NODE_ENV === "production")
    throw new Error("SITE_URL is required");
  return site || "http://localhost:3000";
}
export async function signIn(form: FormData) {
  const db = await createSupabaseServerClient();
  if (!db) redirect("/login?error=config");
  const email = z.email().safeParse(String(form.get("email") || "").trim());
  const password = String(form.get("password") || "");
  if (!email.success || !password || password.length > 256)
    redirect("/login?error=credentials");
  const { error } = await db.auth.signInWithPassword({
    email: email.data,
    password,
  });
  if (error) redirect("/login?error=credentials");
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
      emailRedirectTo: siteUrl() + "/auth/callback?next=/applicant",
    },
  });
  if (error) redirect("/register?error=signup");
  redirect("/register?sent=1");
}
export async function signOut() {
  const db = await createSupabaseServerClient();
  if (db) await db.auth.signOut({ scope: "local" });
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
