"use client";
import {
  createBrowserClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import {
  sessionCookieOptions,
  sessionPreferenceCookie,
} from "../session-preference";
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createBrowserClient(url, key, {
    cookies: {
      getAll: () =>
        parseCookieHeader(document.cookie).map((c) => ({
          name: c.name,
          value: c.value || "",
        })),
      setAll(values) {
        const preference = parseCookieHeader(document.cookie).find(
          (c) => c.name === sessionPreferenceCookie,
        )?.value;
        for (const { name, value, options } of values)
          document.cookie = serializeCookieHeader(
            name,
            value,
            sessionCookieOptions(options, preference),
          );
      },
    },
  });
}
