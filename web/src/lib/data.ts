import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { z } from "zod";
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
  if (error && (!error.status || error.status >= 500 || error.status === 429)) throw new Error("GLF_ACCESS_UNAVAILABLE");
  if (error || !user) return null;
  // Both checks use the verified user/session and must be fresh on every request.
  const [
    { data: profile, error: profileError },
    { data: sessionValid, error: sessionError },
  ] = await Promise.all([
    db.from("profiles")
      .select("id,full_name,role,active,user_admin_scope,access_kind,access_expires_at,archived_at")
      .eq("id", user.id)
      .maybeSingle(),
    db.rpc("access_session_valid"),
  ]);
  if (profileError) throw new Error("GLF_ACCESS_UNAVAILABLE");
  if (!profile?.active || !roles.includes(profile.role)) return null;
  if (sessionError) throw new Error("GLF_ACCESS_UNAVAILABLE");
  if (!sessionValid) return null;
  return { db, user, profile: { ...profile, role: profile.role as Role } };
});
export async function requireViewer(allowed?: readonly Role[]) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profile.access_kind === "academic") redirect("/evaluation");
  if (
    viewer.profile.role === "internal_member" &&
    !allowed?.includes("internal_member")
  )
    redirect("/access");
  if (allowed && !allowed.includes(viewer.profile.role))
    redirect(viewer.profile.role === "applicant" ? "/applicant" : "/internal");
  if (viewer.profile.role !== "applicant") {
    const { data, error } =
      await viewer.db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || data?.currentLevel !== "aal2") redirect("/security");
  }
  return viewer;
}
export async function requireRagViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profile.access_kind === "academic") return viewer;
  return requireViewer(["sustainability_reviewer", "administrator"]);
}
// Read-only entry point: mutating actions continue using requireViewer.
export async function requireReadViewer(allowed?: readonly Role[]) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profile.access_kind === "academic") return viewer;
  return requireViewer(allowed);
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
  const viewer = await requireReadViewer();
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await viewer.db
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("GLF_APPLICATION_UNAVAILABLE");
  if (!data) notFound();
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

export type CallOption = Pick<Call, "id" | "title_es" | "title_en" | "status" | "opens_at" | "closes_at" | "rules">;
export const getCallOptions = cache(async (): Promise<CallOption[]> => {
  const db = await createSupabaseServerClient();
  if (!db) return [];
  const { data, error } = await db.from("calls")
    .select("id,title_es,title_en,status,opens_at,closes_at,rules").order("opens_at", { ascending: false });
  if (error) throw new Error("Cannot read call options");
  return (data || []) as CallOption[];
});
