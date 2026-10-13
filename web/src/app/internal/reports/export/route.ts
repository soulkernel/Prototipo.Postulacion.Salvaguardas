import { callThemeLabel } from "@/lib/call-themes";
import { NextResponse, type NextRequest } from "next/server";
import { requireReadViewer } from "@/lib/data";
import { csvCell } from "@/lib/files";
import { getLocale } from "@/lib/locale";
import { z } from "zod";
export async function GET(request: NextRequest) {
  const { db, profile } = await requireReadViewer([
    "grants_manager",
    "project_coordinator",
    "sustainability_reviewer",
    "committee_member",
    "administrator",
  ]);
  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("call"));
  if (!id.success) return new NextResponse("Invalid call", { status: 400 });
  const { data, error } = await db.rpc(
    profile.access_kind === "academic" ? "academic_call_report" : "call_report",
    {
      requested_call: id.data,
    },
  );
  if (error) return new NextResponse("Unavailable", { status: 500 });
  const locale = await getLocale();
  const { data: call, error: callError } = await db
    .from("calls")
    .select("rules")
    .eq("id", id.data)
    .maybeSingle();
  if (callError || !call)
    return new NextResponse("Unavailable", { status: 500 });
  const rows = [
    ["call_id", id.data],
    ["cutoff_utc", data.cutoff],
    ...[
      "received",
      "invited",
      "phase2_received",
      "approved",
      "signed",
      "not_selected",
      "requested_total",
      "approved_total",
      "signed_total",
    ].map((k) => [k, data[k]]),
    ["project_type", "received"],
    ...data.by_type.map((r: { project_type: string; received: number }) => [
      callThemeLabel(r.project_type, call.rules, locale),
      r.received,
    ]),
  ];
  return new NextResponse(
    "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="GLF-report.csv"',
        "Cache-Control": "private, no-store",
      },
    },
  );
}
