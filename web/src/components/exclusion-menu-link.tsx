import { ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/domain";

export function ExclusionMenuLink({ locale }: { locale: Locale }) {
  const label = locale === "es" ? "Lista de exclusión" : "Exclusion list";
  const hint =
    locale === "es" ? "Se abre en otra pestaña" : "Opens in a new tab";
  return (
    <a
      href="/exclusions"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} · ${hint}`}
      title={hint}
    >
      {label}
      <ExternalLink
        size={13}
        aria-hidden="true"
        className="reference-link-icon"
      />
    </a>
  );
}
