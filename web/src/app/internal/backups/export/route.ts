import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/data";
import { strToU8 } from "fflate";
import { createHash } from "node:crypto";
import { backupSelectionSchema } from "@/lib/backup-selection";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const viewer = await getViewer();
  if (!viewer || viewer.profile.role !== "administrator")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: assurance, error: mfaError } =
    await viewer.db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfaError || assurance?.currentLevel !== "aal2")
    return NextResponse.json({ error: "MFA required" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const selection = backupSelectionSchema.safeParse(body);
  if (!selection.success)
    return NextResponse.json(
      { error: "Invalid backup selection" },
      { status: 400 },
    );
  const call = selection.data.scope === "call" ? selection.data.call : null;
  const selected =
    selection.data.scope === "selected" ? selection.data.applications : [];
  try {
    let query = viewer.db
      .from("applications")
      .select("*")
      .not("submitted_at", "is", null)
      .order("id")
      .limit(201);
    if (call) query = query.eq("call_id", call);
    if (selected.length) query = query.in("id", selected);
    const { data: applications, error } = await query;
    if (error) throw error;
    if (selected.length && applications?.length !== selected.length)
      return NextResponse.json(
        {
          error:
            "Uno o más expedientes ya no están disponibles. Actualice la selección.",
        },
        { status: 409 },
      );
    if ((applications?.length || 0) > 200)
      return NextResponse.json(
        {
          error:
            "Seleccione una convocatoria: esta descarga admite hasta 200 expedientes.",
        },
        { status: 413 },
      );
    const ids = (applications || []).map((a) => a.id);
    const entries: Record<string, Uint8Array> = {};
    const records: Record<string, unknown[]> = {
      applications: applications || [],
    };
    const tables = [
      "application_versions",
      "application_documents",
      "application_events",
      "technical_reviews",
      "governance_decisions",
      "project_agreements",
      "activities",
      "risks",
    ];
    let total = 0;
    const limit = 128 * 1024 * 1024;
    for (const table of tables) {
      const rows: unknown[] = [];
      if (ids.length) {
        for (let offset = 0; ; offset += 250) {
          const { data, error } = await viewer.db
            .from(table)
            .select("*")
            .in("application_id", ids)
            .order("id")
            .range(offset, offset + 249);
          if (error) throw error;
          rows.push(...(data || []));
          if (!data || data.length < 250) break;
        }
      }
      records[table] = rows;
    }
    const callIds = [...new Set((applications || []).map((a) => a.call_id))];
    if (call && !callIds.includes(call)) callIds.push(call);
    const { data: calls, error: callError } = callIds.length
      ? await viewer.db.from("calls").select("*").in("id", callIds)
      : { data: [], error: null };
    if (callError) throw callError;
    records.calls = calls || [];
    const risks = records.risks as { id: string }[];
    const safeguards: { catalog_id: string | null }[] = [];
    for (let offset = 0; offset < risks.length; offset += 100) {
      for (let page = 0; ; page += 250) {
        const { data, error } = await viewer.db
          .from("risk_safeguards")
          .select("*")
          .in(
            "risk_id",
            risks.slice(offset, offset + 100).map((r) => r.id),
          )
          .order("id")
          .range(page, page + 249);
        if (error) throw error;
        safeguards.push(...(data || []));
        if (!data || data.length < 250) break;
      }
    }
    records.risk_safeguards = safeguards;
    const catalogIds = [
      ...new Set(
        safeguards.flatMap((s) => (s.catalog_id ? [s.catalog_id] : [])),
      ),
    ];
    const catalog: unknown[] = [];
    for (let offset = 0; offset < catalogIds.length; offset += 100) {
      const { data, error } = await viewer.db
        .from("safeguard_catalog")
        .select("*")
        .in("id", catalogIds.slice(offset, offset + 100));
      if (error) throw error;
      catalog.push(...(data || []));
    }
    records.safeguard_catalog = catalog;
    for (const [name, rows] of Object.entries(records)) {
      const bytes = strToU8(JSON.stringify(rows, null, 2));
      total += bytes.length;
      entries["datos/" + name + ".json"] = bytes;
    }
    const documents = records.application_documents as {
      id: string;
      application_id: string;
      storage_path: string;
      file_name: string;
      sha256: string;
      size_bytes: number;
    }[];
    if (total + documents.reduce((sum, d) => sum + d.size_bytes, 0) > limit)
      return NextResponse.json(
        {
          error:
            "El respaldo supera 128 MB. Seleccione una convocatoria más pequeña; se requiere el servicio de respaldos para volúmenes mayores.",
        },
        { status: 413 },
      );
    const downloads: {
      path: string;
      url: string;
      sha256: string;
      bytes: number;
    }[] = [];
    for (const document of documents) {
      const { data, error } = await viewer.db.storage
        .from("application-files")
        .createSignedUrl(document.storage_path, 900);
      if (error || !data) throw new Error("Archivo no disponible");
      const filename = document.file_name
        .replace(/[^\p{L}\p{N}._-]/gu, "_")
        .slice(0, 150);
      downloads.push({
        path:
          "archivos/" +
          document.application_id +
          "/" +
          document.id +
          "-" +
          filename,
        url: data.signedUrl,
        sha256: document.sha256,
        bytes: document.size_bytes,
      });
    }
    const manifest = {
      format: "glf-dossier-backup/1",
      created_at: new Date().toISOString(),
      scope: selected.length
        ? "selected-applications"
        : call || "received-applications",
      selected_application_ids: selected,
      actor_id: viewer.user.id,
      application_count: ids.length,
      consistency:
        "Tables read sequentially; not a transactional database snapshot",
      excludes: [
        "Applications that have never been submitted",
        "Auth accounts and secrets",
        "Deployment configuration",
        "RAG corpus",
      ],
      files: Object.entries(entries).map(([path, bytes]) => ({
        path,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      })),
    };
    const responseBody = JSON.stringify({ manifest, records, downloads });
    if (Buffer.byteLength(responseBody) > 4 * 1024 * 1024)
      return NextResponse.json(
        {
          error:
            "Los datos exceden el límite del portal. Seleccione una convocatoria más pequeña.",
        },
        { status: 413 },
      );
    return new NextResponse(responseBody, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Backup export failed",
      error instanceof Error ? error.message : "Unknown failure",
    );
    return NextResponse.json(
      {
        error:
          "No se completó el respaldo. Revise la disponibilidad de los archivos y vuelva a intentarlo.",
      },
      { status: 500 },
    );
  }
}
