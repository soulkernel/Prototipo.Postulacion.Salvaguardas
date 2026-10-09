import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/domain";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const db = await createSupabaseServerClient();
  // Session cookies must stay on the host where verification is processed.
  const base = request.nextUrl.origin;
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const respond = (path: string) => {
    const response = NextResponse.redirect(new URL(path, base));
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  if (
    tokenHash &&
    db &&
    (type === "email" || type === "signup" || type === "recovery")
  ) {
    const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return respond("/login?error=confirmation_link");
    return respond(type === "recovery" ? "/security/password" : "/applicant");
  }
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      return respond(safeReturnPath(request.nextUrl.searchParams.get("next")));
    }
    // Legacy confirmation links can verify email but cannot open a session on
    // another device. Ask for password sign-in instead of claiming signup failed.
    if (request.nextUrl.searchParams.get("next") !== "/security/password")
      return respond("/login?confirmation=signin");
  }
  return respond("/login?error=confirmation_link");
}
