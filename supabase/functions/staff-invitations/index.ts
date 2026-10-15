import { createClient } from "npm:@supabase/supabase-js@2.117.2";

// No secret is sent to Vercel or the browser. Supabase injects these into its runtime.
const site = "https://glf-postulaciones.vercel.app";
const reply = (status: number, error?: string) => new Response(JSON.stringify(error ? { ok: false, error } : { ok: true }), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply(405, "METHOD");
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, "GLF_FORBIDDEN");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret) return reply(503, "GLF_INVITATION_CONFIG");
  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authenticationError } = await caller.auth.getUser();
  if (authenticationError || !user) return reply(401, "GLF_FORBIDDEN");
  const { data: claimsData, error: claimsError } = await caller.auth.getClaims(authorization.slice(7));
  if (claimsError || claimsData?.claims.aal !== "aal2") return reply(403, "GLF_FORBIDDEN");
  const { data: profile } = await caller.from("profiles").select("role,active,user_admin_scope").eq("id",user.id).maybeSingle();
  if (!profile?.active || !(profile.role === "administrator" || (profile.role === "grants_manager" && profile.user_admin_scope === "projects") || (profile.role === "sustainability_reviewer" && profile.user_admin_scope === "sustainability"))) return reply(403,"GLF_FORBIDDEN");
  let input: { id: string; updated_at: string };
  try {
    if (Number(request.headers.get("content-length") || 0) > 2048) return reply(413, "GLF_INVALID_INVITATION");
    const body = await request.json();
    if (body?.operation === "status") return reply(200);
    input = body;
    if (typeof input.id !== "string" || !/^[a-f0-9-]{36}$/i.test(input.id) || typeof input.updated_at !== "string" || !Number.isFinite(Date.parse(input.updated_at))) return reply(400, "GLF_INVALID_INVITATION");
  } catch { return reply(400, "GLF_INVALID_INVITATION"); }
  const { data: claim, error: claimError } = await caller.rpc("begin_staff_invitation", { invitation_id: input.id, expected_updated_at: input.updated_at });
  if (claimError || !claim) {
    const code = claimError?.message.match(/GLF_[A-Z_]+/)?.[0] || "GLF_INVITATION_FAILED";
    return reply(409, code);
  }
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const redirectTo = `${site}/auth/activate`;
  let recipientId = claim.invited_user_id as string | null;
  let failure: string | null = null;
  try {
    if (recipientId) {
      const { data, error } = await admin.auth.admin.getUserById(recipientId);
      if (error || !data.user || data.user.email?.toLowerCase() !== claim.email) failure = "GLF_INVITATION_RECIPIENT";
      else if (data.user.email_confirmed_at) {
        // Verified but not activated recipients receive a fresh one-time Auth link.
        const { error } = await admin.auth.resetPasswordForEmail(claim.email, { redirectTo });
        if (error) failure = error.code || "GLF_INVITATION_EMAIL";
      } else {
        const { error } = await admin.auth.admin.inviteUserByEmail(claim.email, { redirectTo, data: { full_name: claim.full_name, glf_invitation_id: input.id } });
        if (error) failure = error.code || "GLF_INVITATION_EMAIL";
      }
    } else {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(claim.email, { redirectTo, data: { full_name: claim.full_name, glf_invitation_id: input.id } });
      if (error) failure = error.code || "GLF_INVITATION_EMAIL";
      else recipientId = data.user?.id || null;
    }
  } catch { failure = "GLF_INVITATION_EMAIL"; }
  const { error: finishError } = await admin.rpc("finish_staff_invitation", { invitation_id: input.id, attempt: claim.attempt_id, recipient_id: recipientId, failure_code: failure });
  if (finishError) return reply(503, "GLF_INVITATION_RECONCILE");
  return failure ? reply(422, failure) : reply(200);
});
