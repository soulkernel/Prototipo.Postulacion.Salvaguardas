import "server-only";
import { cookies, headers } from "next/headers";
import type { Locale } from "./domain";
export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get("glf_lang")?.value;
  if (stored === "en" || stored === "es") return stored;
  const languages = (await headers()).get("accept-language")?.split(",") || [];
  for (const item of languages) {
    const tag = item.trim().slice(0, 2).toLowerCase();
    if (tag === "en" || tag === "es") return tag;
  }
  return "es";
}
