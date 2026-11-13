"use client";
import { useEffect, useState } from "react";
import {
  findRagProjects,
  loadRagProject,
} from "@/app/internal/evidence/context-actions";
import { RagMethods } from "./rag-methods";
import type { RagProject } from "@/lib/rag-context";
import type { Locale } from "@/lib/domain";
import { ActionLink } from "./action-link";
import { RagSavedEvidence } from "./rag-saved-evidence";
export type RagNote = {
  id: string;
  application_id: string;
  risk_id: string;
  revision: number;
  method: string;
  query: string;
  observation: string;
  created_at: string;
  evidence: unknown;
};
export function RagWorkspace({
  locale,
  projects: initialProjects,
  calls,
  initialProject,
  notes: initialNotes,
  remote = false,
  ...enabled
}: {
  locale: Locale;
  projects: RagProject[];
  calls: { id: string; title: string }[];
  initialProject: string;
  notes: RagNote[];
  e5Enabled: boolean;
  qwenEnabled: boolean;
  remote?: boolean;
}) {
  const es = locale === "es";
  const initial = initialProjects.find((p) => p.id === initialProject);
  const [projects, setProjects] = useState(initialProjects);
  const [notes, setNotes] = useState(initialNotes);
  const [call, setCall] = useState(initial?.callId || "");
  const [projectId, setProjectId] = useState(initialProject || "");
  const [riskId, setRiskId] = useState("");
  const [free, setFree] = useState(!initialProject);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [listBusy, setListBusy] = useState(false);
  const [contextBusy, setContextBusy] = useState(false);
  const [listError, setListError] = useState(false);
  const [contextError, setContextError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loadedProject, setLoadedProject] = useState<RagProject | null>(null);
  useEffect(() => {
    if (!remote || free) return;
    let active = true;
    const timer = setTimeout(() => {
      setListBusy(true);
      setListError(false);
      findRagProjects({ call, search, page })
        .then((result) => {
          if (!active) return;
          setProjects(result.projects);
          setTotal(result.count);
          setListError(result.error);
        })
        .catch(() => {
          if (active) setListError(true);
        })
        .finally(() => {
          if (active) setListBusy(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [remote, free, call, search, page, retry]);
  useEffect(() => {
    if (!remote || !projectId || free) return;
    let active = true;
    loadRagProject(projectId)
      .then((result) => {
        if (!active) return;
        setLoadedProject(result.project);
        setNotes(result.notes);
        setContextError(result.error);
      })
      .catch(() => {
        if (active) setContextError(true);
      })
      .finally(() => {
        if (active) setContextBusy(false);
      });
    return () => {
      active = false;
    };
  }, [remote, projectId, free, retry]);
  const project = remote
    ? loadedProject?.id === projectId
      ? loadedProject
      : undefined
    : projects.find((p) => p.id === projectId);
  const contextPending = remote && projectId && !project && !contextError;
  const risk = project?.risks.find((r) => r.id === riskId);
  const levels: Record<string, string> = es
    ? {
        low: "Bajo",
        medium: "Moderado",
        high: "Alto",
        very_high: "Muy alto",
        incomplete: "Sin completar",
      }
    : {
        low: "Low",
        medium: "Moderate",
        high: "High",
        very_high: "Very high",
        incomplete: "Incomplete",
      };
  return (
    <>
      <section className="live-card rag-context">
        <div className="rag-step-heading">
          <span className="rag-step">1</span>
          <h2>
            {es
              ? "Elija el contexto de su consulta"
              : "Choose your query context"}
          </h2>
        </div>
        <p>
          {es
            ? "Trabaje con un expediente enviado o realice una consulta libre. La calificación del aplicante no se modifica."
            : "Use a submitted application or a free query. The applicant’s rating remains unchanged."}
        </p>
        <div className="rag-mode">
          <button
            type="button"
            aria-pressed={!free}
            onClick={() => setFree(false)}
          >
            {es ? "Desde un proyecto" : "From a project"}
          </button>
          <button
            type="button"
            aria-pressed={free}
            onClick={() => setFree(true)}
          >
            {es ? "Consulta libre" : "Free query"}
          </button>
        </div>
        {!free && (
          <>
            {remote && (
              <label>
                {es
                  ? "Buscar proyecto por título o referencia"
                  : "Search project title or reference"}
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
            )}
            <div className="rag-selectors">
              <label>
                {es ? "Convocatoria" : "Call"}
                <select
                  value={call}
                  onChange={(e) => {
                    setCall(e.target.value);
                    setProjectId("");
                    setRiskId("");
                    setPage(0);
                    setContextBusy(false);
                    setContextError(false);
                  }}
                >
                  <option value="">
                    {es ? "Todas las convocatorias" : "All calls"}
                  </option>
                  {calls.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {es ? "Proyecto" : "Project"}
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setRiskId("");
                    setLoadedProject(null);
                    setContextError(false);
                    setContextBusy(remote && Boolean(e.target.value));
                  }}
                >
                  <option value="">
                    {es
                      ? "Seleccione un proyecto enviado"
                      : "Select a submitted project"}
                  </option>
                  {remote &&
                    project &&
                    !projects.some((p) => p.id === project.id) && (
                      <option value={project.id}>
                        {project.title} · {project.reference}
                      </option>
                    )}
                  {projects
                    .filter((p) => !call || p.callId === call)
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.title} · {p.reference}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            {remote && (
              <div className="list-navigation" aria-busy={listBusy}>
                <button
                  type="button"
                  disabled={listBusy || page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {es ? "Anterior" : "Previous"}
                </button>
                <span role="status">
                  {listBusy
                    ? es
                      ? "Buscando proyectos…"
                      : "Finding projects…"
                    : `${es ? "Página" : "Page"} ${page + 1} · ${total} ${es ? "proyectos" : "projects"}`}
                </span>
                <button
                  type="button"
                  disabled={listBusy || (page + 1) * 20 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {es ? "Siguiente" : "Next"}
                </button>
              </div>
            )}
            {remote && (listError || contextError) && (
              <div role="alert">
                <p>
                  {es
                    ? "No se pudo cargar el proyecto. Compruebe su conexión y reintente."
                    : "The project could not be loaded. Check your connection and retry."}
                </p>
                <button
                  type="button"
                  disabled={listBusy || contextBusy}
                  onClick={() => {
                    setContextError(false);
                    setRetry((n) => n + 1);
                  }}
                >
                  {es ? "Reintentar" : "Retry"}
                </button>
              </div>
            )}
            {(contextPending || contextBusy) && (
              <p role="status">
                {es
                  ? "Cargando riesgos y consultas del proyecto…"
                  : "Loading project risks and queries…"}
              </p>
            )}
            {project && (
              <>
                <label>
                  {es
                    ? "Riesgo y actividad relacionada"
                    : "Risk and related activity"}
                  <select
                    value={riskId}
                    onChange={(e) => setRiskId(e.target.value)}
                  >
                    <option value="">
                      {es ? "Seleccione el riesgo" : "Select a risk"}
                    </option>
                    {project.risks.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.label} · {r.name} — {r.activity}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="rag-context-meta">
                  {es ? "Versión enviada" : "Submitted version"}{" "}
                  {project.revision} ·{" "}
                  {project.stage === 1
                    ? es
                      ? "Nota conceptual · identificación y evaluación"
                      : "Concept note · identification and assessment"
                    : es
                      ? "Propuesta completa · mitigación y PGAS"
                      : "Full proposal · mitigation and ESMP"}
                </p>
                <ActionLink
                  compact
                  href={`/internal/applications/${project.id}`}
                >
                  {es ? "Ver expediente" : "View application"}
                </ActionLink>
                {!project.risks.length && (
                  <p role="status">
                    {es
                      ? "Este expediente no tiene riesgos registrados en el screening."
                      : "No screening risks are recorded for this application."}
                  </p>
                )}
              </>
            )}
            {risk && (
              <div className="rag-risk-summary">
                <strong>
                  {risk.label}: {risk.name}
                </strong>
                <p>{risk.description}</p>
                <p>
                  {es ? "Actividad" : "Activity"}: {risk.activity}
                </p>
                <div className="rag-risk-values">
                  <span>
                    {es ? "Probabilidad" : "Probability"}:{" "}
                    <strong>{risk.probability ?? "—"}/5</strong>
                  </span>
                  <span>
                    {es ? "Gravedad" : "Severity"}:{" "}
                    <strong>{risk.severity ?? "—"}/5</strong>
                  </span>
                  <span>
                    {es ? "Puntaje" : "Score"}:{" "}
                    <strong>
                      {risk.score ?? "—"}/25 · {levels[risk.level]}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </section>
      {free || risk ? (
        <RagMethods
          key={`${free}-${projectId}-${riskId}-${project?.revision || 0}`}
          locale={locale}
          onNoteSaved={remote ? () => setRetry((n) => n + 1) : undefined}
          {...enabled}
          context={!free && project && risk ? { project, risk } : undefined}
        />
      ) : (
        <p className="rag-empty">
          {es
            ? "Seleccione un proyecto y un riesgo para preparar la consulta, o elija Consulta libre."
            : "Select a project and risk to prepare a query, or choose Free query."}
        </p>
      )}
      {!free && risk && (
        <section className="live-card">
          <h2>
            {es
              ? "Consultas recientes guardadas para este riesgo"
              : "Recent saved consultations for this risk"}
          </h2>
          {notes.filter(
            (n) => n.application_id === projectId && n.risk_id === riskId,
          ).length ? (
            notes
              .filter(
                (n) => n.application_id === projectId && n.risk_id === riskId,
              )
              .map((n) => (
                <article className="rag-saved-note" key={n.id}>
                  <strong>
                    {n.method === "e5" ? "E5" : "BM25 + Qwen"} ·{" "}
                    {es ? "Versión" : "Version"} {n.revision}
                  </strong>
                  <p>{n.query}</p>
                  <p>{n.observation}</p>
                  <RagSavedEvidence
                    evidence={n.evidence}
                    method={n.method}
                    es={es}
                  />
                  <small>
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Pacific/Galapagos",
                    }).format(new Date(n.created_at))}{" "}
                    · {es ? "Hora Galápagos" : "Galápagos time"}
                  </small>
                </article>
              ))
          ) : (
            <p>
              {es
                ? "No hay consultas recientes guardadas para este riesgo."
                : "No recent saved consultations for this risk."}
            </p>
          )}
        </section>
      )}
    </>
  );
}
