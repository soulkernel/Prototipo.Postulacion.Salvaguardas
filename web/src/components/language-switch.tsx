"use client";
import { useTransition } from "react";
import { ActionLabel } from "./submit-button";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/domain";
export function LanguageSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="language-switch" aria-label="Idioma / Language">
      {(["es", "en"] as const).map((l) => (
        <button
          type="button"
          key={l}
          aria-pressed={l === locale}
          disabled={pending}
          aria-busy={pending}
          onClick={() => {
            document.cookie =
              "glf_lang=" + l + "; Path=/; Max-Age=31536000; SameSite=Lax";
            document.documentElement.lang = l;
            startTransition(() => router.refresh());
          }}
        >
          <ActionLabel busy={pending && l !== locale} pendingLabel="…">
            {l.toUpperCase()}
          </ActionLabel>
        </button>
      ))}
    </div>
  );
}
