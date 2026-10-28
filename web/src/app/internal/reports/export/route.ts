import { NextResponse, type NextRequest } from "next/server";
import { requireReadViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import {
  reportCsv,
  reportWorkbook,
  type ReportExport,
  type ReportApplication,
} from "@/lib/report-export";
import { reportPdf } from "@/lib/report-pdf";
import { z } from "zod";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const { db, profile } = await requireReadViewer([
    "grants_manager",
    "project_coordinator",
    "sustainability_reviewer",
    "committee_member",
    "administrator",
  ]);
  const params = z
    .object({ call: z.uuid(), format: z.enum(["xlsx", "pdf", "csv"]) })
    .safeParse({
      call: request.nextUrl.searchParams.get("call"),
      format: request.nextUrl.searchParams.get("format") || "csv",
    });
  if (!params.success)
    return new NextResponse("Invalid report selection", { status: 400 });
  const { call: id, format } = params.data;
  const { data: summary, error } = await db.rpc(
    profile.access_kind === "academic" ? "academic_call_report" : "call_report",
    { requested_call: id },
  );
  if (error || !summary)
    return new NextResponse("Unavailable", { status: 500 });
  const locale = await getLocale();
  const { data: call, error: callError } = await db
    .from("calls")
    .select("code,title_es,title_en,rules")
    .eq("id", id)
    .maybeSingle();
  if (callError || !call)
    return new NextResponse("Unavailable", { status: 404 });
  const applications: ReportApplication[] = [];
  // Caller-bound database client retains RLS, including the academic test scope.
  // Export only frozen submitted versions, never the applicant's current draft.
  if (format !== "pdf") {
    for (let offset = 0; ; offset += 250) {
      const { data: apps, error: appsError } = await db
        .from("applications")
        .select("id,reference_code,status,stage,submitted_at")
        .eq("call_id", id)
        .not("submitted_at", "is", null)
        .order("id")
        .range(offset, offset + 249);
      if (appsError) return new NextResponse("Unavailable", { status: 500 });
      if (!apps?.length) break;
      const versions = new Map<
        string,
        {
          concept: Record<string, unknown>;
          stage: number;
          submitted_at: string;
        }
      >();
      for (let n = 0; ; n += 250) {
        const { data, error: versionError } = await db
          .from("application_versions")
          .select("application_id,revision,payload,stage,submitted_at")
          .in(
            "application_id",
            apps.map((a) => a.id),
          )
          .order("revision", { ascending: false })
          .order("id")
          .range(n, n + 249);
        if (versionError)
          return new NextResponse("Unavailable", { status: 500 });
        for (const v of data || [])
          if (!versions.has(v.application_id))
            versions.set(v.application_id, {
              concept: v.payload?.concept || {},
              stage: v.stage,
              submitted_at: v.submitted_at,
            });
        if (!data || data.length < 250) break;
      }
      for (const a of apps) {
        if (!versions.has(a.id))
          return new NextResponse("Submitted version unavailable", {
            status: 409,
          });
        applications.push({ ...a, ...versions.get(a.id)! });
      }
      if (apps.length < 250) break;
    }
  }
  const report: ReportExport = {
    code: call.code,
    title: locale === "es" ? call.title_es : call.title_en,
    summary,
    applications,
    rules: call.rules,
    locale,
  };
  try {
    const content =
      format === "csv"
        ? reportCsv(report)
        : Buffer.from(
            format === "xlsx"
              ? reportWorkbook(report)
              : await reportPdf(report),
          );
    const mime = {
      csv: "text/csv; charset=utf-8",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pdf: "application/pdf",
    };
    const code = call.code.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
    const stamp = new Date(summary.cutoff)
      .toLocaleString("sv-SE", { timeZone: "Pacific/Galapagos" })
      .replace(/[^0-9]/g, "");
    return new NextResponse(content, {
      headers: {
        "Content-Type": mime[format],
        "Content-Disposition": `attachment; filename="GLF-reporte-${code}-${stamp}.${format}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Report generation unavailable", { status: 500 });
  }
}
