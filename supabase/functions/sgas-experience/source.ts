// Source of index.ts; rebuild with node scripts/build-sgas-function.mjs.
// Platform JWT verification remains enabled. getUser verifies the JWT again;
// the user's context RPC enforces ownership, active access, deadlines and revision.
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sgasPdf } from "../../../web/src/lib/sgas-pdf.ts";
import { sgasExperienceSchema } from "../../../web/src/lib/sgas-experience.ts";
import { regular, bold, logo } from "./assets.ts";

const bodySchema = z
  .object({
    id: z.uuid(),
    revision: z.number().int().nonnegative().safe(),
    locale: z.enum(["es", "en"]),
  })
  .strict();
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-store",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
export async function handleSgasRequest(request: Request) {
  if (request.method !== "POST")
    return reply({ error: "GLF_METHOD_NOT_ALLOWED" }, 405);
  if (Number(request.headers.get("content-length") || 0) > 2048)
    return reply({ error: "GLF_INVALID_SGAS" }, 413);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    return reply({ error: "GLF_SGAS_FORBIDDEN" }, 401);
  const url = Deno.env.get("SUPABASE_URL"),
    anon = Deno.env.get("SUPABASE_ANON_KEY"),
    secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret)
    return reply({ error: "GLF_SGAS_GENERATION_FAILED" }, 503);
  const userDb = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: authError,
  } = await userDb.auth.getUser(authorization.slice(7));
  if (authError || !user) return reply({ error: "GLF_SGAS_FORBIDDEN" }, 401);
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return reply({ error: "GLF_INVALID_SGAS" }, 400);
  }
  const { data: context, error: contextError } = await userDb.rpc(
    "sgas_document_context",
    { app_id: body.id, expected_revision: body.revision, locale: body.locale },
  );
  if (contextError || !context)
    return reply(
      {
        error:
          contextError?.message.match(/GLF_[A-Z_]+(?::[a-z0-9_]+)?/)?.[0] ||
          "GLF_SGAS_FORBIDDEN",
      },
      409,
    );
  if (context.document) return reply(context.document);
  if (!sgasExperienceSchema.safeParse(context.source?.questionnaire).success)
    return reply({ error: "GLF_INVALID_SGAS" }, 422);
  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const path = `${body.id}/system/sgas/${crypto.randomUUID()}.pdf`;
  try {
    const at = new Date().toISOString();
    const pdf = await sgasPdf({
      source: context.source,
      reference: context.reference,
      revision: body.revision,
      generatedAt: at,
      locale: body.locale,
      regular: Uint8Array.from(atob(regular), (c) => c.charCodeAt(0)),
      bold: Uint8Array.from(atob(bold), (c) => c.charCodeAt(0)),
      logo: Uint8Array.from(atob(logo), (c) => c.charCodeAt(0)),
    });
    const { error: uploadError } = await admin.storage
      .from("application-files")
      .upload(path, pdf.bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (uploadError) return reply({ error: "GLF_SGAS_GENERATION_FAILED" }, 503);
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", pdf.bytes)),
    )
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
    const reference = String(context.reference)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 100);
    const { data: document, error: registrationError } = await admin.rpc(
      "register_sgas_document",
      {
        app_id: body.id,
        actor_id: user.id,
        actor_session_id: context.session_id ?? null,
        expected_revision: body.revision,
        source: context.source,
        object_path: path,
        original_name: `${reference}_${body.locale === "es" ? "Experiencia-SGAS" : "ESMS-experience"}_v${body.revision}_${body.locale}.pdf`,
        bytes: pdf.bytes.length,
        checksum: hash,
        locale: body.locale,
      },
    );
    if (registrationError || !document) {
      // A response can be lost after the registration committed. Keep the private
      // object on an uncertain outcome; the idempotent context lookup recovers it.
      // Never delete a potentially registered document because of a network error.
      return reply(
        {
          error:
            registrationError?.message.match(
              /GLF_[A-Z_]+(?::[a-z0-9_]+)?/,
            )?.[0] || "GLF_SGAS_GENERATION_FAILED",
        },
        409,
      );
    }
    if (document.storage_path !== path)
      await admin.storage.from("application-files").remove([path]);
    const { storage_path, ...visible } = document;
    return reply(visible);
  } catch {
    return reply({ error: "GLF_SGAS_GENERATION_FAILED" }, 503);
  }
}
Deno.serve(handleSgasRequest);
