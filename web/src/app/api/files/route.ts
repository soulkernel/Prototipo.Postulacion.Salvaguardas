import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getViewer } from "@/lib/data";
import { validateFile } from "@/lib/files";
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
  if (kind === "concept_signed" && valid.extension !== "pdf")
    return NextResponse.json(
      { error: "Signed concept must be PDF" },
      { status: 400 },
    );
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
  const { data, error } = await viewer.db.rpc("register_document", {
    app_id: app.data,
    object_path: path,
    original_name: file.name,
    mime: valid.mime,
    bytes: file.size,
    checksum,
    document_kind: kind,
  });
  if (error)
    return NextResponse.json(
      { error: "Registration rejected; file remains private" },
      { status: 409 },
    );
  return NextResponse.json(
    {
      id: data,
      file_name: file.name,
      kind,
      created_at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
