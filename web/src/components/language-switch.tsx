"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/domain";
export function LanguageSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  return (
    <div className="language-switch" aria-label="Idioma / Language">
      {(["es", "en"] as const).map((l) => (
        <button
          type="button"
          key={l}
          aria-pressed={l === locale}
          onClick={() => {
            document.cookie =
              "glf_lang=" + l + "; Path=/; Max-Age=31536000; SameSite=Lax";
            document.documentElement.lang = l;
            router.refresh();
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
