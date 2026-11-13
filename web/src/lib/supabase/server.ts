import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  sessionCookieOptions,
  sessionPreferenceCookie,
} from "../session-preference";
export function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
// React cache shares this client only within one server render, never across users.
export const createSupabaseServerClient = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(
              name,
              value,
              sessionCookieOptions(
                options,
                store.get(sessionPreferenceCookie)?.value,
              ),
            ),
          );
        } catch {
          /* Server Components cannot write cookies; the proxy refreshes sessions. */
        }
      },
    },
  });
});
