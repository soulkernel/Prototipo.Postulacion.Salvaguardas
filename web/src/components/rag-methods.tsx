"use client";
import { useActionState, useState } from "react";
import { Search, FileText, Sparkles } from "lucide-react";
import { consultQwen, type QwenState } from "@/app/internal/evidence/actions";
import { EvidenceReading } from "./evidence-reading";
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
  readOnly = false,
}: {
  locale: Locale;
  e5Enabled: boolean;
  qwenEnabled: boolean;
  context?: { project: RagProject; risk: RagRisk };
  readOnly?: boolean;
}) {
  const es = locale === "es";
  const [e5Query, setE5Query] = useState<string | undefined>();
  const [purpose, setPurpose] = useState("assessment");
  const [query, setQuery] = useState(
    context ? riskQuery(context.risk, context.project.stage, "qwen") : "",
  );
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
          {es
            ? "Elija el modelo IA de apoyo que necesita"
            : "Choose the AI support model you need"}
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
        <EvidenceSearch
          key={e5Query ?? "initial"}
          suggestedQuery={e5Query}
          locale={locale}
          enabled={e5Enabled}
          context={context}
          readOnly={readOnly}
        />
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
              ? "BM25 busca disposiciones en el corpus público del GLF y Qwen utiliza esa evidencia para proponer una redacción de respuesta con citas. Puede responder parcialmente cuando la normativa solo cubre una parte de la consulta."
              : "BM25 retrieves public GLF provisions and Qwen uses this evidence to propose a cited answer. It may answer partially when the sources cover only part of the question."}
          </p>
          <p>
            {es
              ? "Formule la pregunta en español. No incluya nombres, correos ni datos personales. El texto y la evidencia pública se procesan en servicios externos."
              : "Ask in Spanish. Do not include names, emails or personal information. The question and public evidence are processed by external services."}
          </p>
          {!qwenEnabled && <p role="status">{messages.configuration}</p>}
          <form action={action} className="live-form">
            {context && (
              <label>
                {es ? "Qué desea revisar" : "Review focus"}
                <select
                  value={purpose}
                  disabled={pending}
                  onChange={(event) => {
                    setPurpose(event.target.value);
                    setQuery(
                      riskQuery(
                        context.risk,
                        context.project.stage,
                        "qwen",
                        event.target.value,
                      ),
                    );
                  }}
                >
                  <option value="assessment">
                    {es
                      ? context.project.stage === 1
                        ? "Identificación y evaluación inicial"
                        : "Evaluación y medidas del PGAS"
                      : "Risk assessment"}
                  </option>
                  <option value="exclusions">
                    {es
                      ? "Posibles exclusiones del GLF"
                      : "Potential GLF exclusions"}
                  </option>
                </select>
              </label>
            )}
            <label>
              {es
                ? "Pregunta sobre la normativa"
                : "Question about regulations"}
              <textarea
                name="query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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
                      ? "Propuesta de respuesta para revisión técnica"
                      : "Draft answer for technical review"
                    : es
                      ? "No se pudo fundamentar una respuesta completa"
                      : "A complete answer could not be grounded"}
                </h3>
                {state.response.generated ? (
                  <p className="rag-answer">{state.response.answer}</p>
                ) : (
                  <p>
                    {es
                      ? state.response.reason === "citation_validation_failed"
                        ? "La respuesta propuesta no superó la validación de citas. Puede consultar los fragmentos recuperados, pero no utilizarlos como una respuesta validada."
                        : "No se obtuvo una respuesta suficientemente sustentada para esta consulta. Revise los pasajes disponibles: pueden aportar criterios generales, aunque no resuelvan el caso específico. Puede precisar la pregunta o complementar la búsqueda con E5."
                      : "A sufficiently grounded answer could not be obtained. Review any retrieved passages as supporting material, refine the question or complement the search with E5."}
                  </p>
                )}
                <p>
                  {es
                    ? "La respuesta solo debe tratar como obligaciones los requisitos expresos de la fuente. Las definiciones y orientaciones generales requieren comprobar su aplicabilidad al caso."
                    : "Only explicit source requirements should be treated as obligations. Definitions and general guidance require checking applicability."}
                </p>
                <p>
                  {es ? "Tiempo de procesamiento: " : "Processing time: "}
                  {state.response.timings.total_seconds.toFixed(1)} s
                </p>
                <h4>
                  {es
                    ? state.response.generated
                      ? "Fuentes y evidencia para contrastar la respuesta"
                      : "Pasajes recuperados · material de apoyo"
                    : "Retrieved evidence for review"}
                </h4>
                {!state.response.results.length && (
                  <p>
                    {es
                      ? "No se recibieron pasajes utilizables. Pruebe una pregunta más concreta o consulte E5, que utiliza un corpus diferente."
                      : "No usable passages were returned. Try a more focused question or E5, which uses a different corpus."}
                  </p>
                )}
                {state.response.results.map((source) => (
                  <article className="live-card" key={source.chunk_id}>
                    <h3>{source.source_name}</h3>
                    <p>
                      {es ? "Página " : "Page "}
                      {source.page} · {source.chunk_id} ·{" "}
                      {es
                        ? state.response!.sources.some(
                            (s) => s.chunk_id === source.chunk_id,
                          )
                          ? "Citada en la propuesta"
                          : "Recuperada; no citada en una respuesta validada"
                        : state.response!.sources.some(
                              (s) => s.chunk_id === source.chunk_id,
                            )
                          ? "Cited in the draft"
                          : "Retrieved; not cited in a validated answer"}
                    </p>
                    <EvidenceReading
                      name={source.source_name}
                      text={source.text}
                      locator={`${es ? "página" : "page"} ${source.page}`}
                      locale={locale}
                    />
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
                <button
                  type="button"
                  className="button secondary"
                  disabled={!e5Enabled}
                  onClick={() => {
                    setE5Query(
                      context
                        ? riskQuery(context.risk, context.project.stage, "e5")
                        : state.query,
                    );
                    setMethod("e5");
                    document.getElementById("rag-e5-tab")?.focus();
                  }}
                >
                  {es
                    ? "Buscar evidencia complementaria con E5"
                    : "Find complementary evidence with E5"}
                </button>
                <p>
                  {es
                    ? "Contraste la propuesta con el texto original y registre su criterio técnico. La decisión corresponde al GLF."
                    : "Verify citations and relevance before using them in a review. Cited answers do not certify compliance. GLF retains the decision."}
                </p>
              </>
            )}
            {!readOnly &&
              !pending &&
              state.response &&
              context &&
              state.query && (
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
