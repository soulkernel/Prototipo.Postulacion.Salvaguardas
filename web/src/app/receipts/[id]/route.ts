import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { receiptAttachments, receiptNumber } from "@/lib/receipt";
import { receiptPdf } from "@/lib/receipt-pdf";
import { documentStamp } from "@/lib/document-name";
import type { Locale, Payload, Rules } from "@/lib/domain";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
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
  if (viewer.profile.role !== "applicant") {
    const { data, error } = await viewer.db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || data?.currentLevel !== "aal2")
      return NextResponse.redirect(new URL("/security", request.url));
  }
  // All reads use the caller's Supabase client and existing RLS/MFA policies.
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
    .maybeSingle();
  if (!app) return new NextResponse("Not found", { status: 404 });
  const { data: stored, error } = await viewer.db
    .from("application_documents")
    .select("id,sha256,created_at")
    .eq("application_id", version.application_id);
  if (error) return new NextResponse("Unavailable", { status: 503 });
  const payload = version.payload as Payload & { attachments?: unknown };
  const rules = version.rules_snapshot as Rules;
  const requested = request.nextUrl.searchParams.get("lang");
  const locale: Locale =
    requested === "en" || requested === "es" ? requested : await getLocale();
  const category = rules.categories.find(
    (c) => c.id === payload.concept.category_id,
  );
  const bytes = await receiptPdf({
    id,
    reference: app.reference_code,
    title: payload.concept.title,
    responsible: payload.concept.contact_name,
    actorId: version.actor_id,
    category: category
      ? locale === "es"
        ? category.label_es
        : category.label_en
      : payload.concept.category_id,
    stage: version.stage,
    revision: version.revision,
    receivedAt: version.submitted_at,
    attachments: receiptAttachments(payload.attachments, stored || []),
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin,
    locale,
  });
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receiptNumber(id)}_${documentStamp(version.submitted_at)}_Galapagos_${locale}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
