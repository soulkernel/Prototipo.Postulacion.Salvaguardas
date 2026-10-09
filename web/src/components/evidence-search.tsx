"use client";
import { useActionState } from "react";
import {
  searchEvidence,
  type EvidenceState,
} from "@/app/internal/evidence/actions";
import type { Locale } from "@/lib/domain";
import { ActionLabel } from "./submit-button";

const initial: EvidenceState = { status: "idle", results: [] };
export function EvidenceSearch({
  locale,
  enabled,
}: {
  locale: Locale;
  enabled: boolean;
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
            required
            minLength={10}
            maxLength={1500}
            rows={4}
            disabled={!enabled || pending}
          />
        </label>
        <p>
          {es
            ? "Consulte actividades y riesgos sin nombres, correos ni otros datos personales. El texto se procesa en el servicio de inferencia configurado."
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
        {state.status === "invalid" && (
          <p role="alert">
            {es
              ? "Escriba entre 10 y 1.500 caracteres."
              : "Enter between 10 and 1,500 characters."}
          </p>
        )}
        {state.status === "unavailable" && (
          <p role="alert">
            {es
              ? "No se pudo consultar la evidencia. Intente nuevamente; no se ha emitido una evaluación."
              : "Evidence retrieval failed. Try again; no assessment has been issued."}
          </p>
        )}
        {state.status === "ok" && !state.results.length && (
          <p>
            {es
              ? "No hay evidencia aprobada e indexada disponible. Esto no significa que el proyecto cumpla."
              : "No approved indexed evidence is available. This does not establish compliance."}
          </p>
        )}
        {state.results.map((r) => (
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
      </div>
    </section>
  );
}
