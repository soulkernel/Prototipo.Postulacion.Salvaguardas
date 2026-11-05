"use client";
import { ManualView } from "./manual-view";
import { internalManualGuide } from "@/lib/internal-manual";
import type { Locale } from "@/lib/domain";
export function InternalManual({
  locale,
  backHref,
}: {
  locale: Locale;
  backHref: string;
}) {
  return (
    <ManualView
      locale={locale}
      guide={internalManualGuide}
      backHref={backHref}
    />
  );
}
