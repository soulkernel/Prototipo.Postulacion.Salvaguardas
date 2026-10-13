"use client";
import { useActionState } from "react";
import {
  searchEvidence,
  type EvidenceState,
} from "@/app/internal/evidence/actions";
import { riskQuery, type RagProject, type RagRisk } from "@/lib/rag-context";
import { RagNoteForm } from "./rag-note-form";
import type { Locale } from "@/lib/domain";
import { ActionLabel } from "./submit-button";

const initial: EvidenceState = { status: "idle", results: [] };
export function EvidenceSearch({
  locale,
  enabled,
  context,
  readOnly = false,
}: {
  locale: Locale;
  enabled: boolean;
  context?: { project: RagProject; risk: RagRisk };
  readOnly?: boolean;
}) {
  const es = locale === "es";
  const [state, action, pending] = useActionState(searchEvidence, initial);
  return (
    <section className="live-card">
      <form action={action} className="live-form">
        <label>
          {es ? "Actividad o riesgo a consultar" : "Activity or risk to search"}
          <textarea
            name="query"
            defaultValue={
              context
                ? riskQuery(context.risk, context.project.stage, "e5")
                : ""
            }
            placeholder={
              es
                ? "Describa la actividad y el riesgo ambiental o social que desea contrastar con la normativa."
                : "Describe the activity and environmental or social risk to compare with regulations."
            }
            spellCheck
            lang={es ? "es" : "en"}
            required
            minLength={10}
            maxLength={1500}
            rows={4}
            disabled={!enabled || pending}
          />
        </label>
        <p>
          {es
            ? "Revise el texto antes de buscar. Incluya solo la actividad y el riesgo, sin nombres, correos ni datos personales. Máximo 1.500 caracteres. El texto se procesa en un servicio externo."
            : "Describe activities and risks without names, emails or other personal data. The configured inference service processes this text."}
        </p>
        <button
          className="button primary"
          disabled={!enabled || pending}
          aria-busy={pending}
        >
          <ActionLabel
            busy={pending}
            pendingLabel={es ? "Buscando evidencia…" : "Searching…"}
          >
            {es ? "Buscar evidencia normativa" : "Search normative evidence"}
          </ActionLabel>
        </button>
      </form>
      <div aria-live="polite">
        {!pending && state.status === "quota" && (
          <p role="alert">
            {es
              ? "Se alcanzó el límite de consultas del acceso académico. Intente más tarde."
              : "The academic query limit has been reached. Try later."}
          </p>
        )}
        {!pending && state.status === "invalid" && (
          <p role="alert">
            {es
              ? "Escriba entre 10 y 1.500 caracteres."
              : "Enter between 10 and 1,500 characters."}
          </p>
        )}
        {!pending && state.status === "unavailable" && (
          <p role="alert">
            {es
              ? "No se pudo consultar la evidencia. Intente nuevamente; no se ha emitido una evaluación."
              : "Evidence retrieval failed. Try again; no assessment has been issued."}
          </p>
        )}
        {!pending && state.status === "ok" && !state.results.length && (
          <p>
            {es
              ? "No hay evidencia aprobada e indexada disponible. Esto no significa que el proyecto cumpla."
              : "No approved indexed evidence is available. This does not establish compliance."}
          </p>
        )}
        {!pending &&
          state.results.map((r) => (
            <article className="live-card" key={r.id}>
              <h3>{r.document_name}</h3>
              <p>
                {r.document_version} · {r.locator}
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>{r.content}</p>
              <p>
                {es
                  ? "Referencia para revisión humana. La similitud no es una calificación de cumplimiento."
                  : "Reference for human review. Similarity is not a compliance rating."}
              </p>
            </article>
          ))}
        {!readOnly &&
          !pending &&
          state.status === "ok" &&
          context &&
          state.query && (
            <RagNoteForm
              key={state.query + JSON.stringify(state.results)}
              context={context}
              method="e5"
              query={state.query}
              evidence={{ results: state.results }}
              es={es}
            />
          )}
      </div>
    </section>
  );
}
