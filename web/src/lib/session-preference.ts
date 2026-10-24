import type { CookieOptions } from "@supabase/ssr";
export const sessionPreferenceCookie = "glf_session_preference";
export const rememberSeconds = 90 * 24 * 60 * 60;
export function sessionCookieOptions(
  options: CookieOptions,
  preference?: string,
  now = Date.now(),
): CookieOptions {
  if (options.maxAge === 0 || !preference) return options;
  const until = Number(preference);
  if (preference === "session" || !Number.isFinite(until))
    return { ...options, maxAge: undefined, expires: undefined };
  const seconds = Math.max(
    0,
    Math.min(rememberSeconds, Math.floor((until - now) / 1000)),
  );
  return {
    ...options,
    maxAge: seconds,
    expires: new Date(now + seconds * 1000),
  };
}
