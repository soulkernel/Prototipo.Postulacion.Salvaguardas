import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { applicationPdf } from "@/lib/pdf";
import type { Payload, Locale } from "@/lib/domain";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { id, kind } = await params;
  if (!z.uuid().safeParse(id).success || !["concept", "matrix"].includes(kind))
    return new NextResponse("Not found", { status: 404 });
  const viewer = await getViewer();
  if (!viewer)
    return NextResponse.redirect(
      new URL(
        "/login?next=" +
          encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search),
        request.url,
      ),
    );
  const { data: version } = await viewer.db
    .from("application_versions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!version) return new NextResponse("Not found", { status: 404 });
  const { data: app } = await viewer.db
    .from("applications")
    .select("reference_code")
    .eq("id", version.application_id)
    .single();
  if (!app) return new NextResponse("Not found", { status: 404 });
  const requested = request.nextUrl.searchParams.get("lang");
  const locale: Locale =
    requested === "en" || requested === "es" ? requested : await getLocale();
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const downloadUrl =
    base + "/documents/" + id + "/" + kind + "?lang=" + locale;
  const result = await applicationPdf({
    payload: version.payload as Payload,
    reference: app.reference_code,
    revision: version.revision,
    submittedAt: version.submitted_at,
    kind: kind as "concept" | "matrix",
    locale,
    downloadUrl,
  });
  return new NextResponse(Buffer.from(result.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="GLF-' + version.revision + "-" + kind + '.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
