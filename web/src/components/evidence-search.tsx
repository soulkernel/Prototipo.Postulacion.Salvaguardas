"use client";
import {
  evidenceSourceName,
  evidenceLocation,
} from "@/lib/evidence-presentation";
import { EvidenceReading } from "./evidence-reading";
import { useActionState, useState } from "react";
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
  suggestedQuery,
}: {
  locale: Locale;
  enabled: boolean;
  context?: { project: RagProject; risk: RagRisk };
  readOnly?: boolean;
  suggestedQuery?: string;
}) {
  const es = locale === "es";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [state, action, pending] = useActionState(searchEvidence, initial);
  return (
    <section className="live-card">
      <form
        action={action}
        className="live-form"
        onSubmit={() => {
          setSelectedIds([]);
          setReviewSaved(false);
        }}
      >
        <label>
          {es ? "Actividad o riesgo a consultar" : "Activity or risk to search"}
          <textarea
            name="query"
            defaultValue={
              suggestedQuery ??
              (context
                ? riskQuery(context.risk, context.project.stage, "e5")
                : "")
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
        {!pending && state.status === "ok" && state.results.length > 0 && (
          <div className="rag-result-intro">
            <h3>
              {es
                ? "Evidencia encontrada para su revisión"
                : "Evidence found for your review"}
            </h3>
            <p>
              {es
                ? `E5 encontró ${state.results.length} pasajes relacionados con su consulta. La guía de lectura explica cómo consultarlos; el extracto conserva el texto de la fuente. La relación semántica no demuestra que una disposición sea aplicable al caso.`
                : `E5 found ${state.results.length} passages related to your query. The reading guide explains how to review them; excerpts retain the source wording. Semantic relevance does not establish applicability.`}
            </p>
          </div>
        )}
        {!pending &&
          state.results.map((r) => (
            <article className="live-card" key={r.id}>
              {!readOnly && context && (
                <label className="rag-evidence-choice">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(String(r.id))}
                    disabled={reviewSaved}
                    onChange={(e) =>
                      setSelectedIds((ids) =>
                        e.target.checked
                          ? [...ids, String(r.id)]
                          : ids.filter((id) => id !== String(r.id)),
                      )
                    }
                  />
                  <span>
                    {es
                      ? "Evidencia pertinente para este riesgo"
                      : "Relevant evidence for this risk"}
                  </span>
                </label>
              )}
              <h3>{evidenceSourceName(r.document_name)}</h3>
              <p>{evidenceLocation(r.locator, es)}</p>
              <EvidenceReading
                name={evidenceSourceName(r.document_name)}
                text={r.content}
                locator={evidenceLocation(r.locator, es)}
                locale={locale}
              />
              <details className="evidence-metadata">
                <summary>
                  {es
                    ? "Referencia técnica del fragmento"
                    : "Technical passage reference"}
                </summary>
                <p>
                  {r.document_name} · {r.document_version} · {r.locator}
                </p>
              </details>
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
              selectedIds={selectedIds}
              onSaved={() => setReviewSaved(true)}
            />
          )}
      </div>
    </section>
  );
}
