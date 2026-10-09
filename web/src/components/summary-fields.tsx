"use client";
import {
  summarySections,
  summaryText,
  hasSummaryParts,
  type SummaryParts,
} from "@/lib/summary";
import { words, type Locale } from "@/lib/domain";
import { RequiredMark } from "./required-mark";
export function SummaryFields({
  parts,
  legacy,
  limit,
  locale,
  onChange,
}: {
  parts: SummaryParts;
  legacy: string;
  limit: number;
  locale: Locale;
  onChange: (parts: SummaryParts) => void;
}) {
  const es = locale === "es";
  const shown =
    !hasSummaryParts(parts) && legacy.trim()
      ? { ...parts, context: legacy }
      : parts;
  const total = words(summaryText(shown));
  return (
    <section className="activity-card">
      <h3>{es ? "Resumen del proyecto" : "Project summary"}</h3>
      <p
        className={total > limit ? "auth-error" : "field-help"}
        aria-live="polite"
      >
        {total} / {limit}{" "}
        {es
          ? "palabras en total entre las seis secciones"
          : "words in total across all six sections"}
        {total > limit &&
          (es
            ? ". Reduzca el texto antes de continuar."
            : ". Shorten the text before continuing.")}
      </p>
      {!hasSummaryParts(parts) && legacy.trim() && (
        <p className="field-help">
          {es
            ? "Su resumen anterior se conserva en Contexto. Distribúyalo entre las secciones antes de guardar cambios."
            : "Your previous summary is preserved in Context. Redistribute it across the sections before saving changes."}
        </p>
      )}
      <div className="live-grid">
        {summarySections.map((s) => (
          <label key={s.key}>
            {es ? s.es : s.en}
            <RequiredMark locale={locale} />
            <small>{s.help[es ? 0 : 1]}</small>
            <textarea
              aria-required="true"
              rows={3}
              maxLength={12000}
              value={shown[s.key]}
              onChange={(e) => onChange({ ...shown, [s.key]: e.target.value })}
            />
            <small>
              {words(shown[s.key])}{" "}
              {es
                ? "palabras · incluidas en el total"
                : "words · included in the total"}
            </small>
          </label>
        ))}
      </div>
    </section>
  );
}
