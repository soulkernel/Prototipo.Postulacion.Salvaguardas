import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/domain";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const db = await createSupabaseServerClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(
        new URL(safeReturnPath(request.nextUrl.searchParams.get("next")), base),
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  return NextResponse.redirect(new URL("/login?error=credentials", base));
}
