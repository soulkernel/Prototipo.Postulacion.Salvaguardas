import type { Locale } from "@/lib/domain";
export function RequiredMark({ locale }: { locale: Locale }) {
  return (
    <span
      className="required-mark"
      aria-label={locale === "es" ? "Obligatorio" : "Required"}
    >
      {" "}
      *
    </span>
  );
}
