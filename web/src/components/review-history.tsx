import { statusLabel, workflowLabel } from "@/lib/fields";
import type { Locale } from "@/lib/domain";
type Review = {
  id: string;
  revision: number;
  review_type: string;
  reviewer_id: string;
  findings: string;
  recommendation: string;
  created_at: string;
  global_risk_category?: string | null;
  review_context?: {
    stage: number;
    status: string;
    author_name: string;
  } | null;
};
type Note = {
  id: string;
  revision: number;
  stage: number;
  application_status: string;
  review_type: string;
  author_id: string;
  author_name: string;
  findings: string;
  recommendation: string;
  created_at: string;
};
export function ReviewHistory({
  reviews,
  notes,
  locale,
  versions,
}: {
  reviews: Review[];
  notes: Note[];
  locale: Locale;
  versions: { revision: number; stage: number }[];
}) {
  const es = locale === "es";
  const entries = [
    ...reviews.map((r) => ({
      id: r.id,
      kind: "review",
      revision: r.revision,
      stage:
        r.review_context?.stage ??
        versions.find((v) => v.revision === r.revision)?.stage,
      status: r.review_context?.status,
      author: r.review_context?.author_name || r.reviewer_id,
      area: r.review_type,
      findings: r.findings,
      recommendation: r.recommendation,
      created_at: r.created_at,
      category: r.global_risk_category,
    })),
    ...notes.map((n) => ({
      id: n.id,
      kind: "note",
      revision: n.revision,
      stage: n.stage,
      status: n.application_status,
      author: n.author_name || n.author_id,
      area: n.review_type,
      findings: n.findings,
      recommendation: n.recommendation,
      created_at: n.created_at,
      category: null,
    })),
  ].sort(
    (a, b) =>
      Date.parse(b.created_at) - Date.parse(a.created_at) ||
      a.id.localeCompare(b.id),
  );
  if (!entries.length)
    return (
      <p>
        {es
          ? "Aún no hay revisiones técnicas ni notas de seguimiento registradas."
          : "No technical reviews or follow-up notes have been recorded yet."}
      </p>
    );
  return (
    <ol className="review-timeline">
      {entries.map((e) => (
        <li className="review-history-entry" key={e.id}>
          <h3>
            {e.kind === "review"
              ? es
                ? "Revisión técnica"
                : "Technical review"
              : es
                ? "Nota de seguimiento"
                : "Follow-up note"}{" "}
            · {workflowLabel("review", e.area, locale)}
          </h3>
          <p className="field-help">
            <time dateTime={e.created_at}>
              {new Date(e.created_at).toLocaleString(locale, {
                timeZone: "Pacific/Galapagos",
              })}
            </time>{" "}
            · {es ? "Hora Galápagos" : "Galapagos time"}
            <br />
            {es ? "Autor" : "Author"}: {e.author}
            <br />
            {es ? "Fase" : "Phase"} {e.stage ?? "—"} ·{" "}
            {es ? "Versión presentada" : "Submitted version"} {e.revision} ·{" "}
            {e.status
              ? statusLabel(e.status, locale)
              : es
                ? "Estado no registrado en el formato anterior"
                : "Status not recorded in the earlier format"}
          </p>
          <p className="preserve-text">{e.findings}</p>
          {e.recommendation && (
            <>
              <h4>
                {es
                  ? "Recomendación o siguiente acción"
                  : "Recommendation or next action"}
              </h4>
              <p className="preserve-text">{e.recommendation}</p>
            </>
          )}
          {e.category && (
            <p>
              {es
                ? "Categoría confirmada por el especialista"
                : "Specialist-confirmed category"}
              : {e.category}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
