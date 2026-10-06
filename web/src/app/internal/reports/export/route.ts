import { NextResponse, type NextRequest } from "next/server";
import { requireViewer } from "@/lib/data";
import { csvCell } from "@/lib/files";
import { z } from "zod";
export async function GET(request: NextRequest) {
  const { db } = await requireViewer([
    "grants_manager",
    "project_coordinator",
    "sustainability_reviewer",
    "committee_member",
    "administrator",
  ]);
  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("call"));
  if (!id.success) return new NextResponse("Invalid call", { status: 400 });
  const { data, error } = await db.rpc("call_report", {
    requested_call: id.data,
  });
  if (error) return new NextResponse("Unavailable", { status: 500 });
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
      r.project_type,
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
