"use client";
import { useRef, useState } from "react";
import {
  Search,
  Sparkles,
  Clock3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { EvidenceReading } from "./evidence-reading";
import { RagNoteForm } from "./rag-note-form";
import {
  riskRetrievalQuery,
  riskQuery,
  type RagProject,
  type RagRisk,
} from "@/lib/rag-context";
import {
  evidenceSourceName,
  evidenceLocation,
} from "@/lib/evidence-presentation";
import { exportRagResult, type RagCode } from "@/lib/rag-session";
import type { Locale } from "@/lib/domain";
import { useRagQuery } from "./use-rag-query";
import "./rag-console.css";

export function RagConsole({
  locale,
  e5Enabled,
  qwenEnabled,
  context,
  readOnly = false,
  initialMethod,
  suggestedQuery,
}: {
  locale: Locale;
  e5Enabled: boolean;
  qwenEnabled: boolean;
  context?: { project: RagProject; risk: RagRisk };
  readOnly?: boolean;
  initialMethod?: "e5" | "qwen";
  suggestedQuery?: string;
}) {
  const es = locale === "es",
    t = (a: string, b: string) => (es ? a : b);
  const defaultMethod = initialMethod || (qwenEnabled ? "qwen" : "e5");
  const [method, setMethod] = useState<"e5" | "qwen">(defaultMethod);
  const [query, setQuery] = useState(
    suggestedQuery ??
      (context
        ? riskQuery(context.risk, context.project.stage, defaultMethod)
        : ""),
  );
  const [purpose, setPurpose] = useState("assessment"),
    [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewSaved, setReviewSaved] = useState(false),
    [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const session = useRagQuery(),
    { pending, result } = session;
  const min = method === "e5" ? 10 : 3,
    max = method === "e5" ? 1500 : 600;
  const enabled = method === "e5" ? e5Enabled : qwenEnabled;
  const contextLabel = context
    ? `${context.project.reference} · ${context.risk.label} · ${t("versión", "version")} ${context.project.revision} · ${t("fase", "phase")} ${context.project.stage}`
    : t("Consulta libre", "Free query");
  const messages: Record<RagCode, string> = {
    invalid: t(
      `Escriba entre ${min} y ${max} caracteres, sin contar espacios al inicio o al final.`,
      `Enter ${min}–${max} characters, excluding leading and trailing spaces.`,
    ),
    offline: t(
      "No hay conexión a internet. Su consulta permanece aquí; reintente cuando recupere la conexión.",
      "You are offline. Your query remains here; retry when your connection returns.",
    ),
    timeout: t(
      "La espera superó el tiempo disponible. Su consulta se conserva. Puede intentar más tarde; el servicio podría continuar la solicitud anterior.",
      "The waiting time was exceeded. Your query is preserved. Retry later; the service may still process the previous request.",
    ),
    quota: t(
      "Se alcanzó el límite de consultas. Intente más tarde o revise las fuentes que ya tiene disponibles.",
      "The query limit was reached. Try later or review sources already available.",
    ),
    configuration: t(
      "Este servicio necesita atención del administrador. Puede utilizar el otro método si está disponible.",
      "This service needs administrator attention. Use the other method if available.",
    ),
    unavailable: t(
      "El servicio no pudo completar la consulta. El texto se conserva; vuelva a intentarlo en unos momentos.",
      "The service could not complete your query. Your text is preserved; try again shortly.",
    ),
    session: t(
      "Su sesión debe verificarse nuevamente. Copie su pregunta antes de iniciar sesión o verificar su acceso.",
      "Your session needs verification. Copy your question before signing in or verifying access.",
    ),
    forbidden: t(
      "Su cuenta no tiene permiso para esta consulta. Consulte al administrador.",
      "Your account does not have permission for this query. Contact the administrator.",
    ),
    "invalid-response": t(
      "La respuesta no superó los controles de formato o referencias. No se mostrará como evidencia. Reformule la pregunta o utilice el otro método.",
      "The response failed format or reference checks. It will not be shown as evidence. Rephrase or use the other method.",
    ),
    cancelled: t(
      "Se detuvo la espera. Su pregunta se conserva. El servicio podría terminar la solicitud recibida y contabilizarla dentro de su límite.",
      "Waiting stopped. Your question is preserved. The service may finish the received request and count it toward your limit.",
    ),
  };
  const stageNames: Record<string, string> = {
    connecting: t(
      "Esperando respuesta del servicio",
      "Waiting for the service",
    ),
    embedding: t("Procesando consulta con E5", "Processing query with E5"),
    retrieval: t(
      "Buscando pasajes documentales",
      "Retrieving document passages",
    ),
    generation: t(
      "Qwen está elaborando la respuesta",
      "Qwen is drafting the answer",
    ),
    verification: t("Comprobando referencias", "Checking references"),
  };
  function clearReview() {
    setSelectedIds([]);
    setReviewSaved(false);
    setFeedback("");
  }
  function changeMethod(next: "e5" | "qwen") {
    if (pending) return;
    setMethod(next);
    session.reset();
    clearReview();
    setQuery(
      context
        ? riskQuery(context.risk, context.project.stage, next, purpose)
        : query.slice(0, next === "qwen" ? 600 : 1500),
    );
  }
  async function submit() {
    clearReview();
    const retrieval =
      context &&
      query.trim() ===
        riskQuery(context.risk, context.project.stage, "qwen", purpose).trim()
        ? riskRetrievalQuery(context.risk, purpose)
        : query.trim();
    await session.run({
      method,
      query,
      ...(method === "qwen" ? { retrieval_query: retrieval } : {}),
    });
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(
        t(
          "Copiado. No se ha enviado información a terceros.",
          "Copied. No information was sent to anyone.",
        ),
      );
    } catch {
      setFeedback(
        t(
          "No se pudo copiar. Seleccione el texto o descargue la consulta.",
          "Copy failed. Select the text or download the query.",
        ),
      );
    }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([exportRagResult(result, contextLabel, es)], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `GLF-consulta-${result.requestId.slice(0, 8)}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback(
      t(
        "Consulta preparada para descargar con sus referencias.",
        "Query prepared for download with references.",
      ),
    );
  }
  const response = result?.response;
  const sources = response
    ? response.results.map((r, i) => ({
        id: r.chunk_id,
        name: r.source_name,
        locator: `${t("Página", "Page")} ${r.page}`,
        text: r.text,
        url: r.source_url.split("#")[0] + `#page=${r.page}`,
        technical: r.chunk_id,
        cited: response.sources.some((s) => s.chunk_id === r.chunk_id),
        number: i + 1,
      }))
    : (result?.results || []).map((r, i) => ({
        id: String(r.id),
        name: evidenceSourceName(r.document_name),
        locator: evidenceLocation(r.locator, es),
        text: r.content,
        url: "",
        technical: `${r.document_name} · ${r.document_version} · ${r.locator}`,
        cited: false,
        number: i + 1,
      }));
  const examples = [
    [
      t("Lista de exclusión", "Exclusion list"),
      "¿Qué actividades no financia el GLF según su lista de exclusión?",
    ],
    [
      t("Participación", "Participation"),
      "¿Qué orientaciones establece el GLF para la participación de las partes interesadas?",
    ],
    [
      t("Biodiversidad", "Biodiversity"),
      "¿Qué criterios de biodiversidad deben revisarse en un proyecto?",
    ],
  ];
  return (
    <div className="rag-console">
      <div className="rag-intro">
        <strong>
          {t(
            "Plantee su consulta → Revise la respuesta → Compruebe las fuentes",
            "Ask your question → Review the answer → Check the sources",
          )}
        </strong>
        <p>
          {t(
            "Consulte la documentación de salvaguardas del GLF. El asistente aporta evidencia para su revisión; las decisiones corresponden al GLF.",
            "Consult GLF safeguards documents. The assistant supports your review with evidence; GLF retains decision authority.",
          )}
        </p>
      </div>
      <h2>{t("¿Qué necesita hacer?", "What would you like to do?")}</h2>
      <div
        className="rag-task-tabs"
        role="tablist"
        aria-label={t("Tipo de consulta", "Query type")}
      >
        {(["qwen", "e5"] as const).map((mode) => (
          <button
            key={mode}
            id={`rag-${mode}-tab`}
            type="button"
            role="tab"
            aria-controls="rag-query-panel"
            aria-selected={method === mode}
            tabIndex={method === mode ? 0 : -1}
            disabled={pending}
            onClick={() => changeMethod(mode)}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
                event.preventDefault();
                const next = mode === "e5" ? "qwen" : "e5";
                changeMethod(next);
                document.getElementById(`rag-${next}-tab`)?.focus();
              }
            }}
          >
            {mode === "qwen" ? (
              <Sparkles size={22} aria-hidden="true" />
            ) : (
              <Search size={22} aria-hidden="true" />
            )}
            <span>
              {mode === "qwen"
                ? t(
                    "Obtener una respuesta con fuentes",
                    "Get an answer with sources",
                  )
                : t(
                    "Buscar fragmentos en los documentos",
                    "Find passages in documents",
                  )}
              <small>
                {mode === "qwen" ? "BM25 + Qwen" : "Multilingual E5"}
              </small>
            </span>
          </button>
        ))}
      </div>
      <section
        id="rag-query-panel"
        role="tabpanel"
        aria-labelledby={`rag-${method}-tab`}
        className="live-card"
      >
        <p>
          {method === "qwen"
            ? t(
                "Recupera pasajes públicos del GLF y propone una respuesta en español con referencias. Puede indicar que la evidencia es insuficiente.",
                "Retrieves public GLF passages and drafts a Spanish answer with references. It may report insufficient evidence.",
              )
            : t(
                "Busca pasajes por su significado en las fuentes aprobadas. Permite leer la evidencia original; no redacta una respuesta.",
                "Searches approved sources by meaning. Read original evidence; this method does not draft an answer.",
              )}
        </p>
        {!enabled && (
          <div className="rag-notice rag-warning" role="status">
            {t(
              "Este método o sus fuentes no están disponibles. Utilice el otro método si está habilitado.",
              "This method or its sources are unavailable. Use the other method if enabled.",
            )}
          </div>
        )}
        <form
          className="live-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (enabled && !pending) void submit();
          }}
        >
          {context && (
            <label>
              {t("Qué desea revisar", "Review focus")}
              <select
                value={purpose}
                disabled={pending}
                onChange={(event) => {
                  setPurpose(event.target.value);
                  setQuery(
                    riskQuery(
                      context.risk,
                      context.project.stage,
                      method,
                      event.target.value,
                    ),
                  );
                  session.reset();
                  clearReview();
                }}
              >
                <option value="assessment">
                  {context.project.stage === 1
                    ? t(
                        "Identificación y evaluación inicial",
                        "Initial identification and assessment",
                      )
                    : t(
                        "Evaluación y medidas del PGAS",
                        "Assessment and management measures",
                      )}
                </option>
                <option value="exclusions">
                  {t(
                    "Posibles exclusiones del GLF",
                    "Potential GLF exclusions",
                  )}
                </option>
              </select>
            </label>
          )}
          <label htmlFor="rag-query">{t("Su consulta", "Your question")}</label>
          <textarea
            ref={inputRef}
            id="rag-query"
            name="query"
            rows={4}
            value={query}
            maxLength={max}
            minLength={min}
            required
            disabled={pending || !enabled}
            aria-invalid={session.error === "invalid"}
            aria-describedby={`rag-query-help rag-query-count${session.error === "invalid" ? " rag-query-error" : ""}`}
            lang="es"
            spellCheck
            placeholder={t(
              "Escriba aquí la actividad, el riesgo o la pregunta que desea consultar…",
              "Write your activity, risk or question here (in Spanish)…",
            )}
            onChange={(event) => {
              setQuery(event.target.value);
              session.reset();
              clearReview();
            }}
          />
          <div id="rag-query-count" className="rag-counter">
            {query.length} / {max} {t("caracteres", "characters")} ·{" "}
            {Math.max(0, max - query.length)} {t("disponibles", "remaining")}
          </div>
          <p id="rag-query-help" className="rag-privacy">
            {t(
              `Mínimo ${min} caracteres. No incluya nombres, correos, datos personales ni información confidencial. La consulta y los pasajes públicos se procesan en servicios externos.`,
              `Minimum ${min} characters. Do not include names, emails, personal or confidential data. External services process the query and public passages.`,
            )}
          </p>
          {!context && (
            <div
              className="rag-examples"
              aria-label={t(
                "Ejemplos: completan la pregunta sin enviarla",
                "Examples: fill the query without submitting it",
              )}
            >
              {examples.map(([name, text]) => (
                <button
                  key={name}
                  type="button"
                  disabled={pending || !enabled}
                  onClick={() => {
                    setQuery(text);
                    session.reset();
                    clearReview();
                    inputRef.current?.focus();
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <div className="rag-actions">
            <button
              className="button primary"
              disabled={!enabled || pending}
              aria-busy={pending}
            >
              {pending ? (
                <>
                  <Clock3
                    className="rag-spinner"
                    size={18}
                    aria-hidden="true"
                  />{" "}
                  {t("Procesando consulta…", "Processing query…")}
                </>
              ) : (
                t("Consultar", "Submit query")
              )}
            </button>
            {pending && (
              <button
                type="button"
                className="button secondary"
                onClick={session.cancel}
              >
                {t("Detener espera", "Stop waiting")}
              </button>
            )}
          </div>
        </form>
        {pending && (
          <div className="rag-notice">
            <div role="status" aria-live="polite">
              <h3>
                <Clock3 size={20} className="rag-spinner" aria-hidden="true" />
                {stageNames[session.stage.stage]}
              </h3>
              <p>{session.stage.model || "GLF"}</p>
            </div>
            <p aria-hidden="true">
              {session.seconds.toFixed(1)} s ·{" "}
              {t("Tiempo de espera transcurrido", "Elapsed waiting time")}
            </p>
            <ol className="rag-progress">
              {(method === "e5"
                ? ["embedding", "retrieval"]
                : ["retrieval", "generation", "verification"]
              ).map((stage) => (
                <li
                  key={stage}
                  data-current={session.stage.stage === stage}
                  data-seen={session.seen.includes(stage)}
                >
                  {stageNames[stage]}{" "}
                  {session.stage.stage === stage
                    ? t("· en curso", "· in progress")
                    : session.seen.includes(stage)
                      ? "✓"
                      : t("· pendiente", "· pending")}
                </li>
              ))}
            </ol>
            <p className="rag-privacy">
              {t(
                "Etapas confirmadas por el servidor. El reloj no representa un porcentaje de avance.",
                "Server-confirmed stages. The timer is not a completion percentage.",
              )}
            </p>
          </div>
        )}
        {session.error && (
          <div
            id="rag-query-error"
            className={`rag-notice ${["quota", "cancelled"].includes(session.error) ? "rag-warning" : "rag-error"}`}
            role="alert"
          >
            <h3>
              <AlertCircle size={20} aria-hidden="true" />
              {t("Revise esta información", "Please review")}
            </h3>
            <p>{messages[session.error]}</p>
            <div className="rag-actions">
              {["offline", "timeout", "unavailable"].includes(
                session.error,
              ) && (
                <button
                  className="button secondary"
                  onClick={() => void submit()}
                  disabled={pending}
                >
                  {t("Reintentar consulta", "Retry query")}
                </button>
              )}
              {session.error === "session" && (
                <>
                  <button
                    className="button secondary"
                    onClick={() => void copy(query)}
                  >
                    {t("Copiar pregunta", "Copy question")}
                  </button>
                  <a className="button secondary" href="/login">
                    {t("Verificar acceso", "Verify access")}
                  </a>
                </>
              )}
              {session.requestId && (
                <button
                  className="button secondary"
                  onClick={() =>
                    void copy(
                      `GLF RAG · ${method} · ${session.error} · ID ${session.requestId}`,
                    )
                  }
                >
                  {t(
                    "Copiar datos para reportar el problema",
                    "Copy diagnostic details",
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        {result && (
          <div
            className="rag-results"
            aria-label={t("Resultado de la consulta", "Query result")}
          >
            <div className="rag-notice" role="status">
              <h3>
                <CheckCircle2 size={20} aria-hidden="true" />
                {t("Consulta finalizada", "Query completed")}
              </h3>
              <p>{contextLabel}</p>
              <p>
                <strong>
                  {t("Pregunta consultada: ", "Submitted question: ")}
                </strong>
                {result.query}
              </p>
            </div>
            <div className="rag-meta">
              <span>
                {sources.length}{" "}
                {t("pasajes recuperados", "retrieved passages")}
              </span>
              {response && (
                <span>
                  {response.sources.length}{" "}
                  {t("referencias citadas", "cited references")}
                </span>
              )}
              <span>{result.seconds.toFixed(1)} s</span>
            </div>
            {response &&
              (response.generated ? (
                <>
                  <h3>
                    {t(
                      "Respuesta propuesta para su revisión",
                      "Proposed answer for review",
                    )}
                  </h3>
                  <p className="rag-answer">
                    {response.answer
                      .split(/(\[[^\[\]\n]+::[^\[\]\n]+\])/g)
                      .map((part, i) => {
                        const source = sources.find(
                          (s) => `[${s.id}]` === part,
                        );
                        return source ? (
                          <a
                            key={i}
                            href={`#rag-source-${source.number}`}
                            aria-label={`${t("Ver fuente", "View source")} ${source.number}: ${source.name}`}
                          >
                            [{source.number}]
                          </a>
                        ) : (
                          part
                        );
                      })}
                  </p>
                </>
              ) : (
                <div className="rag-notice rag-warning">
                  <h3>
                    <AlertCircle size={20} aria-hidden="true" />
                    {response.reason === "citation_validation_failed"
                      ? t(
                          "Las referencias no pudieron validarse",
                          "References could not be validated",
                        )
                      : t(
                          "Evidencia insuficiente para responder",
                          "Insufficient evidence to answer",
                        )}
                  </h3>
                  <p>
                    {t(
                      "Revise los pasajes como material de apoyo. Precise la actividad o el riesgo. La falta de evidencia no significa que el proyecto cumpla.",
                      "Review passages as supporting material. Specify the activity or risk. Lack of evidence does not establish compliance.",
                    )}
                  </p>
                </div>
              ))}
            {!sources.length && (
              <p className="rag-notice rag-warning">
                {t(
                  "No se recuperaron pasajes. Pruebe términos más concretos o consulte los documentos originales.",
                  "No passages were retrieved. Try more specific terms or consult original documents.",
                )}
              </p>
            )}
            <div className="rag-actions">
              <button
                className="button secondary"
                onClick={() =>
                  void copy(exportRagResult(result, contextLabel, es))
                }
              >
                {t("Copiar con referencias", "Copy with references")}
              </button>
              <button className="button secondary" onClick={download}>
                {t("Descargar consulta", "Download query")}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  inputRef.current?.focus();
                  inputRef.current?.scrollIntoView({ block: "center" });
                }}
              >
                {t("Ajustar pregunta", "Refine question")}
              </button>
            </div>
            <h3>{t("Compruebe la evidencia", "Check the evidence")}</h3>
            <p>
              {t(
                "Una referencia comprobada identifica el pasaje; no garantiza que la interpretación sea correcta o aplicable a su caso. Lea el documento y su contexto.",
                "A checked reference identifies a passage; it does not guarantee a correct or applicable interpretation. Read the document and context.",
              )}
            </p>
            {sources.map((source) => (
              <article
                className="rag-source"
                id={`rag-source-${source.number}`}
                key={source.id}
              >
                <h4>
                  [{source.number}] {source.name}
                </h4>
                <p>
                  {source.locator} ·{" "}
                  {source.cited
                    ? t("Citada en la respuesta", "Cited in the answer")
                    : t(
                        "Pasaje recuperado para revisión",
                        "Retrieved passage for review",
                      )}
                </p>
                {!readOnly && context && (
                  <label className="rag-evidence-choice">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(source.id)}
                      disabled={reviewSaved}
                      onChange={(event) =>
                        setSelectedIds((ids) =>
                          event.target.checked
                            ? [...ids, source.id]
                            : ids.filter((id) => id !== source.id),
                        )
                      }
                    />
                    {t(
                      "Evidencia pertinente para este riesgo",
                      "Relevant evidence for this risk",
                    )}
                  </label>
                )}
                <EvidenceReading
                  name={source.name}
                  text={source.text}
                  locator={source.locator}
                  locale={locale}
                />
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Abrir documento fuente ↗", "Open source document ↗")}
                  </a>
                )}
                <details className="rag-technical">
                  <summary>
                    {t("Referencia técnica", "Technical reference")}
                  </summary>
                  <p>{source.technical}</p>
                </details>
              </article>
            ))}
            {!readOnly && context && (
              <RagNoteForm
                key={result.requestId}
                context={context}
                method={result.method}
                query={result.query}
                evidence={response || { results: result.results }}
                es={es}
                selectedIds={selectedIds}
                onSaved={() => setReviewSaved(true)}
              />
            )}
            <details className="rag-technical">
              <summary>
                {t("Detalles de esta ejecución", "Execution details")}
              </summary>
              <p>
                {t("Modelo / método: ", "Model / method: ")}
                {result.model}
              </p>
              <p>
                {t(
                  "Tiempo total medido en el portal: ",
                  "Total portal processing time: ",
                )}
                {result.seconds.toFixed(2)} s
              </p>
              {response && (
                <p>
                  {t("Tiempo del servicio: ", "Service time: ")}
                  {response.timings.total_seconds.toFixed(2)} s ·{" "}
                  {t("Versión del servicio: ", "Service version: ")}
                  {response.review_support_version ||
                    t("no informada", "not reported")}
                </p>
              )}
              <p>
                Portal v{result.version} · ID {result.requestId}
              </p>
              {response?.retrieval_query && (
                <p>
                  {t("Texto de búsqueda: ", "Retrieval query: ")}
                  {response.retrieval_query}
                </p>
              )}
              <p>
                {t(
                  "Estos datos describen esta ejecución. No son métricas de precisión ni probabilidades de que la respuesta sea correcta.",
                  "These details describe this execution. They are not accuracy metrics or probabilities that the answer is correct.",
                )}
              </p>
            </details>
          </div>
        )}
        <p role="status" aria-live="polite">
          {feedback}
        </p>
      </section>
      {session.history.length > 0 && (
        <details className="rag-history">
          <summary>
            {t("Consultas de esta sesión", "Queries in this session")} (
            {session.history.length}/5)
          </summary>
          <p>
            {t(
              "Solo en esta pantalla y contexto; se eliminan al salir o recargar. Las notas guardadas por riesgo se conservan por separado.",
              "Kept only in this screen and context; cleared on exit or reload. Saved risk notes are stored separately.",
            )}
          </p>
          {session.history.map((item) => (
            <button
              className="button secondary"
              key={item.requestId}
              disabled={pending}
              onClick={() => {
                setMethod(item.method);
                setQuery(item.query);
                clearReview();
                session.restore(item);
              }}
            >
              {item.method === "qwen" ? "BM25 + Qwen" : "E5"} · {item.query}
            </button>
          ))}
          <button
            className="button secondary"
            onClick={session.clearHistory}
            disabled={pending}
          >
            {t(
              "Vaciar historial de esta pantalla",
              "Clear this screen’s history",
            )}
          </button>
        </details>
      )}
      <details>
        <summary>
          {t(
            "Cómo funciona y qué debe tener en cuenta",
            "How it works and what to keep in mind",
          )}
        </summary>
        <ul>
          <li>
            {t(
              "RAG significa generación aumentada por recuperación: busca evidencia para fundamentar una respuesta.",
              "RAG means retrieval-augmented generation: it retrieves evidence to ground an answer.",
            )}
          </li>
          <li>
            {t(
              "BM25 busca términos en documentos públicos GLF. Qwen redacta a partir de los pasajes recuperados mediante Hugging Face y el proveedor configurado. El nombre exacto del modelo aparece durante la generación.",
              "BM25 retrieves term matches in public GLF documents. Qwen drafts from passages through Hugging Face and the configured provider. The exact model appears during generation.",
            )}
          </li>
          <li>
            {t(
              "E5 (intfloat/multilingual-e5-small) representa la consulta en 384 dimensiones; Supabase busca pasajes relacionados en fuentes aprobadas. La similitud no es un porcentaje de certeza.",
              "E5 (intfloat/multilingual-e5-small) represents the query in 384 dimensions; Supabase retrieves related approved passages. Similarity is not a certainty percentage.",
            )}
          </li>
          <li>
            {t(
              "Los métodos utilizan corpus distintos. Compruebe el documento, página o localizador y la versión indicada en cada referencia. La revisión humana verifica vigencia, alcance y aplicabilidad.",
              "Methods use different corpora. Check each document, page or locator and version. Human review verifies currency, scope and applicability.",
            )}
          </li>
          <li>
            {t(
              "Puede haber omisiones, respuestas parciales o interpretaciones incorrectas. El asistente no determina elegibilidad, aprobación ni cumplimiento. No introduzca información personal o confidencial.",
              "Omissions, partial answers or incorrect interpretations are possible. The assistant does not determine eligibility, approval or compliance. Do not enter personal or confidential information.",
            )}
          </li>
        </ul>
      </details>
    </div>
  );
}
