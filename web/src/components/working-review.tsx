"use client";
import {
  rubricEnglish,
  checklistEnglish,
  reviewGroupsEnglish,
} from "@/lib/evaluation-translations";
import { useState } from "react";
import type { Locale } from "@/lib/domain";
import { saveWorkingReview } from "@/app/internal/applications/working-actions";
export type ReviewCriterion = {
  id: string;
  group: string;
  text: string;
  max?: number;
  sourceItem?: number | string;
};
export function WorkingReview({
  applicationId,
  versionId,
  kind,
  templateId,
  criteria,
  initial,
  locale,
  editable,
}: {
  applicationId: string;
  versionId: string;
  kind: "rubric" | "administrative";
  templateId: string;
  criteria: ReviewCriterion[];
  initial: {
    answers: Record<string, number | string | null>;
    notes: string;
    revision: number;
  } | null;
  locale: Locale;
  editable: boolean;
}) {
  const es = locale === "es",
    rubric = kind === "rubric";
  const [answers, setAnswers] = useState(initial?.answers ?? {}),
    [notes, setNotes] = useState(initial?.notes ?? ""),
    [revision, setRevision] = useState(initial?.revision ?? 0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const answered = criteria.filter(
      (c) => answers[c.id] !== null && answers[c.id] !== undefined,
    ),
    total = answered.reduce(
      (s, c) =>
        s + (typeof answers[c.id] === "number" ? (answers[c.id] as number) : 0),
      0,
    );
  return (
    <section className="live-card live-form working-review">
      <h2>
        {rubric
          ? es
            ? "Mi evaluación técnica"
            : "My technical evaluation"
          : es
            ? "Mi revisión administrativa previa al CAT"
            : "My administrative review before CAT"}
      </h2>
      <p>
        {es
          ? "Borrador individual asociado a la versión remitida. No cambia el estado del expediente ni emite una decisión."
          : "Individual draft associated with the submitted version. It does not change application status or issue a decision."}
      </p>
      {rubric && (
        <p>
          {es
            ? `${criteria.length} criterios · máximo ${criteria.length * 5} puntos. Un criterio sin responder no equivale a cero.`
            : `${criteria.length} criteria · maximum ${criteria.length * 5} points. An unanswered criterion does not count as zero.`}
        </p>
      )}
      <small>
        {templateId} · {es ? "Revisión" : "Revision"} {revision}
      </small>
      <fieldset disabled={busy || !editable} className="live-fieldset">
        {criteria.map((c) => (
          <label className="live-risk" key={c.id}>
            <strong>
              {es ? c.group : (reviewGroupsEnglish[c.group] ?? c.group)} ·{" "}
              {rubric ? c.id : c.sourceItem}
            </strong>
            <span>
              {!es && templateId.startsWith("manual-glf-2025-v1")
                ? ((rubric ? rubricEnglish : checklistEnglish)[
                    templateId.endsWith("-1") ? 1 : 2
                  ]?.[c.id] ?? c.text)
                : c.text}
            </span>
            {!es && (
              <details>
                <summary>Original wording (Spanish)</summary>
                <p>{c.text}</p>
              </details>
            )}
            <select
              value={answers[c.id] ?? ""}
              onChange={(e) => {
                setMessage("");
                setAnswers({
                  ...answers,
                  [c.id]:
                    e.target.value === ""
                      ? null
                      : rubric
                        ? Number(e.target.value)
                        : e.target.value,
                });
              }}
            >
              <option value="">{es ? "Sin responder" : "Unanswered"}</option>
              {rubric
                ? [
                    "Muy deficiente",
                    "Deficiente",
                    "Adecuado",
                    "Bueno",
                    "Muy bueno",
                  ].map((t, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1} —{" "}
                      {es
                        ? t
                        : [
                            "Very poor",
                            "Poor",
                            "Adequate",
                            "Good",
                            "Very good",
                          ][i]}
                    </option>
                  ))
                : [
                    ["yes", "Sí", "Yes"],
                    ["no", "No", "No"],
                    ["pending", "Pendiente", "Pending"],
                    ["not_applicable", "No aplica", "Not applicable"],
                  ].map(([v, s, e]) => (
                    <option key={v} value={v}>
                      {es ? s : e}
                    </option>
                  ))}
            </select>
            {!rubric && c.id === "cofinance" && (
              <small>
                {es
                  ? "En subvenciones pequeñas, cero cofinanciación continúa permitido. La contradicción del checklist está pendiente de aclaración y no bloquea."
                  : "Zero cofinancing remains permitted for small grants. The checklist discrepancy requires clarification and does not block submission."}
              </small>
            )}
          </label>
        ))}
        <label>
          {es ? "Observaciones" : "Notes"}
          <textarea
            value={notes}
            maxLength={5000}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </fieldset>
      {rubric && (
        <p>
          <strong>
            {answered.length === criteria.length
              ? `${total} / ${criteria.length * 5}`
              : es
                ? `Evaluación incompleta: ${answered.length}/${criteria.length} criterios. Suma parcial: ${total}.`
                : `Incomplete evaluation: ${answered.length}/${criteria.length} criteria. Partial sum: ${total}.`}
          </strong>
        </p>
      )}
      <button
        type="button"
        className="button primary"
        disabled={busy || !editable}
        aria-busy={busy}
        onClick={async () => {
          if (!editable || busy) return;
          setBusy(true);
          setMessage("");
          try {
            const r = await saveWorkingReview({
              applicationId,
              versionId,
              kind,
              revision,
              answers,
              notes,
            });
            if (r.error) {
              setMessage(r.error);
              return;
            }
            setRevision(r.revision!);
            setMessage(es ? "Borrador guardado." : "Draft saved.");
          } catch {
            setMessage(
              es
                ? "No se pudo guardar. Sus cambios permanecen en pantalla."
                : "Could not save. Your changes remain on screen.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? es
            ? "Procesando…"
            : "Processing…"
          : es
            ? "Guardar mi borrador"
            : "Save my draft"}
      </button>
      <p role="status">{message}</p>
      {!editable && (
        <p>
          {es
            ? "Consulta de borradores: esta etapa no permite editar la evaluación."
            : "Drafts are read-only at this stage."}
        </p>
      )}
      <p>
        {es
          ? "El promedio definitivo, el cierre de evaluaciones y las decisiones automáticas no están habilitados."
          : "Final averages, evaluation closure and automatic decisions are not enabled."}
      </p>
    </section>
  );
}
