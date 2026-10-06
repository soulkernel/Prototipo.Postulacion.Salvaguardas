import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import {
  roles,
  emptyPayload,
  type Role,
  type Application,
  type Call,
} from "./domain";
export const getViewer = cache(async () => {
  const db = await createSupabaseServerClient();
  if (!db) return null;
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("id,full_name,role,active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.active || !roles.includes(profile.role)) return null;
  return { db, user, profile: { ...profile, role: profile.role as Role } };
});
export async function requireViewer(allowed?: readonly Role[]) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (allowed && !allowed.includes(viewer.profile.role))
    redirect(viewer.profile.role === "applicant" ? "/applicant" : "/internal");
  if (viewer.profile.role !== "applicant") {
    const { data, error } =
      await viewer.db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || data?.currentLevel !== "aal2") redirect("/security");
  }
  return viewer;
}
export async function getCalls(): Promise<Call[]> {
  const db = await createSupabaseServerClient();
  if (!db) return [];
  const { data, error } = await db
    .from("calls")
    .select("*")
    .order("opens_at", { ascending: false });
  if (error) throw new Error("Cannot read calls");
  return (data || []) as Call[];
}
export async function getApplication(id: string) {
  const viewer = await requireViewer();
  const { data, error } = await viewer.db
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  const raw = data as Application;
  const base = emptyPayload();
  return {
    viewer,
    application: {
      ...raw,
      payload: {
        ...base,
        ...raw.payload,
        concept: { ...base.concept, ...raw.payload.concept },
      },
    } as Application,
  };
}

export const getRequestTime = cache(() => Date.now());
