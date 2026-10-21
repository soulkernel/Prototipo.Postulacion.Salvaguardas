import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getViewer } from "@/lib/data";
import { validateFile } from "@/lib/files";
import { detectPdfSignature } from "@/lib/pdf-signature";
import {
  applicationAttachments,
  partnerLetterPrefix,
} from "@/lib/attachment-requirements";
import { validateRequiredFile } from "@/lib/attachment-validation";
import { z } from "zod";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const viewer = await getViewer();
  if (!viewer)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (viewer.profile.role !== "applicant") {
    const { data } = await viewer.db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== "aal2")
      return NextResponse.json({ error: "MFA required" }, { status: 403 });
  }
  // Vercel's request limit is lower than Storage's object limit. Direct signed uploads
  // should be enabled before raising this route above 4 MB.
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4 * 1024 * 1024)
    return NextResponse.json({ error: "Upload limit: 4 MB" }, { status: 413 });
  const form = await request.formData();
  const file = form.get("file");
  const app = z.uuid().safeParse(form.get("application_id"));
  const kind = String(form.get("kind") || "other").trim();
  if (kind === "sgas_experience") return NextResponse.json({error:"GLF_SGAS_FORBIDDEN"},{status:403});
  if (
    !app.success ||
    !(file instanceof File) ||
    file.size > 4 * 1024 * 1024 ||
    !kind ||
    kind.length > 100
  )
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid = validateFile(file.name, bytes);
  if (!valid)
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  const { data: applicationRules, error: rulesError } = await viewer.db
    .from("applications")
    .select("rules_snapshot,payload,stage")
    .eq("id", app.data)
    .maybeSingle();
  if (rulesError || !applicationRules)
    return NextResponse.json(
      { error: "Application unavailable" },
      { status: 403 },
    );
  const requirement = applicationAttachments(
    applicationRules.rules_snapshot,
    applicationRules.payload.concept,
    applicationRules.stage,
  ).find((r) => r.id === kind);
  if (kind.startsWith(partnerLetterPrefix) && !requirement)
    return NextResponse.json(
      { error: "GLF_PARTNER_LINK_REQUIRED" },
      { status: 409 },
    );
  if (requirement) {
    const issue = await validateRequiredFile(requirement, file.name, bytes);
    if (issue) return NextResponse.json({ error: issue }, { status: 422 });
  }
  if (
    ["concept_signed", "matrix_signed"].includes(kind) &&
    valid.extension !== "pdf"
  )
    return NextResponse.json(
      { error: "Signed document must be PDF" },
      { status: 400 },
    );
  if (["concept_signed", "matrix_signed"].includes(kind)) {
    const signature = await detectPdfSignature(bytes);
    if (signature !== "detected")
      return NextResponse.json(
        {
          error:
            signature === "missing"
              ? "GLF_SIGNATURE_MISSING"
              : "GLF_SIGNATURE_UNREADABLE",
        },
        { status: 422 },
      );
  }
  let signedRevision: number | null = null;
  if (
    ["concept_signed", "matrix_signed"].includes(kind) &&
    viewer.profile.role === "applicant"
  ) {
    const revision = z.coerce
      .number()
      .int()
      .min(0)
      .safeParse(form.get("revision"));
    const { data: application } = await viewer.db
      .from("applications")
      .select("revision,stage")
      .eq("id", app.data)
      .maybeSingle();
    if (!application)
      return NextResponse.json(
        { error: "Application unavailable" },
        { status: 403 },
      );
    if (application.stage === 1) {
      if (!revision.success || revision.data !== application.revision)
        return NextResponse.json(
          { error: "GLF_VERSION_CONFLICT" },
          { status: 409 },
        );
      const { data: prepared } = await viewer.db
        .from("prepared_documents")
        .select("id")
        .eq("application_id", app.data)
        .eq("revision", application.revision)
        .eq("stage", 1)
        .maybeSingle();
      if (!prepared)
        return NextResponse.json(
          { error: "GLF_PREPARE_DOCUMENTS_REQUIRED" },
          { status: 409 },
        );
      signedRevision = revision.data;
    }
  }
  const folder = kind === "agreement" ? "agreement" : "attachment";
  const path = [
    app.data,
    viewer.user.id,
    folder,
    crypto.randomUUID() + "." + valid.extension,
  ].join("/");
  const { error: uploadError } = await viewer.db.storage
    .from("application-files")
    .upload(path, bytes, { contentType: valid.mime, upsert: false });
  if (uploadError)
    return NextResponse.json({ error: "Upload rejected" }, { status: 403 });
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const { data, error } = await viewer.db.rpc(
    signedRevision === null ? "register_document" : "register_signed_document",
    {
      app_id: app.data,
      object_path: path,
      original_name: file.name,
      mime: valid.mime,
      bytes: file.size,
      checksum,
      document_kind: kind,
      ...(signedRevision === null ? {} : { expected_revision: signedRevision }),
    },
  );
  if (error)
    return NextResponse.json(
      {
        error:
          error.message.match(/GLF_[A-Z_]+/)?.[0] ||
          "Registration rejected; file remains private",
      },
      { status: 409 },
    );
  const { data: registered } = await viewer.db
    .from("application_documents")
    .select("id,file_name,kind,created_at")
    .eq("id", data)
    .maybeSingle();
  if (!registered)
    return NextResponse.json(
      { error: "Document registered; reload to retrieve its status" },
      { status: 503 },
    );
  return NextResponse.json(registered, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
