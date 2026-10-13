"use client";
import { useActionState, useState } from "react";
import { Search, FileText, Sparkles } from "lucide-react";
import { consultQwen, type QwenState } from "@/app/internal/evidence/actions";
import { EvidenceSearch } from "./evidence-search";
import { ActionLabel } from "./submit-button";
import { riskQuery, type RagProject, type RagRisk } from "@/lib/rag-context";
import { RagNoteForm } from "./rag-note-form";
import type { Locale } from "@/lib/domain";

export function RagMethods({
  locale,
  e5Enabled,
  qwenEnabled,
  context,
}: {
  locale: Locale;
  e5Enabled: boolean;
  qwenEnabled: boolean;
  context?: { project: RagProject; risk: RagRisk };
}) {
  const es = locale === "es";
  const [method, setMethod] = useState("e5");
  const [state, action, pending] = useActionState(consultQwen, {
    status: "idle",
  } as QwenState);
  const messages = {
    invalid: es
      ? "Escriba una pregunta de 3 a 600 caracteres."
      : "Enter a question of 3–600 characters.",
    configuration: es
      ? "El servicio BM25 + Qwen aún no está conectado."
      : "The BM25 + Qwen service is not connected yet.",
    quota: es
      ? "Se alcanzó el límite de consultas del servicio. Intente más tarde."
      : "The service query limit has been reached. Try later.",
    unavailable: es
      ? "No se pudo obtener una respuesta. El servicio puede estar iniciándose, sin créditos o temporalmente no disponible. Intente más tarde."
      : "No answer could be obtained. The service may be starting, out of credits or temporarily unavailable. Try later.",
  };
  return (
    <>
      <div className="rag-step-heading">
        <span className="rag-step">2</span>
        <h2>
          {es ? "Elija el apoyo que necesita" : "Choose the support you need"}
        </h2>
      </div>
      <div
        className="rag-tabs"
        role="tablist"
        aria-label={es ? "Métodos de apoyo" : "Support methods"}
      >
        <button
          id="rag-e5-tab"
          role="tab"
          aria-selected={method === "e5"}
          aria-controls="rag-e5-panel"
          tabIndex={method === "e5" ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              setMethod("qwen");
              document.getElementById("rag-qwen-tab")?.focus();
            }
          }}
          onClick={() => setMethod("e5")}
        >
          <Search size={18} strokeWidth={1.7} aria-hidden="true" />
          {es ? "Buscar evidencia · E5" : "Find evidence · E5"}
        </button>
        <button
          id="rag-qwen-tab"
          role="tab"
          aria-selected={method === "qwen"}
          aria-controls="rag-qwen-panel"
          tabIndex={method === "qwen" ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              setMethod("e5");
              document.getElementById("rag-e5-tab")?.focus();
            }
          }}
          onClick={() => setMethod("qwen")}
        >
          <span className="rag-document-icon" aria-hidden="true">
            <FileText size={18} strokeWidth={1.7} />
            <Sparkles size={10} strokeWidth={1.7} />
          </span>
          {es
            ? "Consultar normativa · BM25 + Qwen"
            : "Ask about regulations · BM25 + Qwen"}
        </button>
      </div>
      <div
        id="rag-e5-panel"
        role="tabpanel"
        aria-labelledby="rag-e5-tab"
        hidden={method !== "e5"}
      >
        <p>
          {es
            ? "Encuentra fragmentos normativos relacionados con la actividad y el riesgo. Revise la evidencia original; no genera respuestas ni calificaciones."
            : "Finds regulatory passages related to the activity and risk. Review original evidence; does not generate answers or ratings."}
        </p>
        {!e5Enabled && (
          <p role="status">
            {es
              ? "Se habilitará cuando estén disponibles el servicio E5 y fuentes aprobadas."
              : "Available once the E5 service and approved sources are ready."}
          </p>
        )}
        <EvidenceSearch locale={locale} enabled={e5Enabled} context={context} />
      </div>
      <div
        id="rag-qwen-panel"
        role="tabpanel"
        aria-labelledby="rag-qwen-tab"
        hidden={method !== "qwen"}
      >
        <section className="live-card">
          <h2>
            {es
              ? "Respuesta con fuentes · BM25 + Qwen"
              : "Answer with sources · BM25 + Qwen"}
          </h2>
          <p>
            {es
              ? "Redacta una respuesta a su pregunta utilizando normativa pública recuperada con BM25. Revise que las citas sustenten la respuesta; sus fuentes pueden diferir de E5."
              : "Drafts an answer using public regulations retrieved by BM25. Check that the citations support the answer; sources may differ from E5."}
          </p>
          <p>
            {es
              ? "Formule la pregunta en español. No incluya nombres, correos ni datos personales. El texto y la evidencia pública se procesan en servicios externos."
              : "Ask in Spanish. Do not include names, emails or personal information. The question and public evidence are processed by external services."}
          </p>
          {!qwenEnabled && <p role="status">{messages.configuration}</p>}
          <form action={action} className="live-form">
            <label>
              {es
                ? "Pregunta sobre la normativa"
                : "Question about regulations"}
              <textarea
                name="query"
                defaultValue={
                  context
                    ? riskQuery(context.risk, context.project.stage, "qwen")
                    : ""
                }
                placeholder={
                  es
                    ? "Ejemplo: ¿Qué criterios normativos deben revisarse para evaluar este riesgo?"
                    : "Example (ask in Spanish): ¿Qué criterios normativos deben revisarse para evaluar este riesgo?"
                }
                rows={4}
                required
                minLength={3}
                maxLength={600}
                spellCheck
                lang="es"
                disabled={!qwenEnabled || pending}
              />
            </label>
            <p>
              {es
                ? "Revise y ajuste la pregunta antes de consultar. Máximo 600 caracteres; respuesta en español."
                : "Review and edit the question before submitting. Maximum 600 characters; answers in Spanish."}
            </p>
            <button
              className="button primary"
              disabled={!qwenEnabled || pending}
              aria-busy={pending}
            >
              <ActionLabel
                busy={pending}
                pendingLabel={
                  es ? "Consultando normativa…" : "Consulting regulations…"
                }
              >
                {es ? "Consultar normativa" : "Ask about regulations"}
              </ActionLabel>
            </button>
          </form>
          <div aria-live="polite">
            {!pending && state.status !== "idle" && state.status !== "ok" && (
              <p role="alert">{messages[state.status]}</p>
            )}
            {!pending && state.response && (
              <>
                <h3>
                  {state.response.generated
                    ? es
                      ? "Respuesta para revisión técnica"
                      : "Answer for technical review"
                    : es
                      ? "Evidencia insuficiente"
                      : "Insufficient evidence"}
                </h3>
                <p className="rag-answer">{state.response.answer}</p>
                <p>
                  {es ? "Tiempo de procesamiento: " : "Processing time: "}
                  {state.response.timings.total_seconds.toFixed(1)} s
                </p>
                {state.response.sources.map((source) => (
                  <article className="live-card" key={source.chunk_id}>
                    <h3>{source.source_name}</h3>
                    <p>
                      {es ? "Página " : "Page "}
                      {source.page} · {source.chunk_id}
                    </p>
                    <p className="rag-answer">
                      {
                        state.response!.results.find(
                          (row) => row.chunk_id === source.chunk_id,
                        )?.text
                      }
                    </p>
                    <a
                      href={
                        source.source_url.split("#")[0] + `#page=${source.page}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {es
                        ? "Consultar documento fuente ↗"
                        : "Open source document ↗"}
                    </a>
                  </article>
                ))}
                <p>
                  {es
                    ? "Verifique las citas y su pertinencia antes de fundamentar una revisión. Una respuesta con citas no certifica cumplimiento. La decisión corresponde al GLF."
                    : "Verify citations and relevance before using them in a review. Cited answers do not certify compliance. GLF retains the decision."}
                </p>
              </>
            )}
            {!pending && state.response && context && state.query && (
              <RagNoteForm
                key={state.query + JSON.stringify(state.response)}
                context={context}
                method="qwen"
                query={state.query}
                evidence={state.response}
                es={es}
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
