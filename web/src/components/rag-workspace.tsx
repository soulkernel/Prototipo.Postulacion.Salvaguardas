"use client";
import { useState } from "react";
import { RagMethods } from "./rag-methods";
import type { RagProject } from "@/lib/rag-context";
import type { Locale } from "@/lib/domain";
import Link from "./feedback-link";
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
  projects,
  calls,
  initialProject,
  notes,
  ...enabled
}: {
  locale: Locale;
  projects: RagProject[];
  calls: { id: string; title: string }[];
  initialProject: string;
  notes: RagNote[];
  e5Enabled: boolean;
  qwenEnabled: boolean;
}) {
  const es = locale === "es";
  const initial = projects.find((p) => p.id === initialProject);
  const [call, setCall] = useState(initial?.callId || "");
  const [projectId, setProjectId] = useState(initial?.id || "");
  const [riskId, setRiskId] = useState("");
  const [free, setFree] = useState(false);
  const project = projects.find((p) => p.id === projectId);
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
              ? "Seleccione el riesgo que desea revisar"
              : "Select the risk to review"}
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
            <div className="rag-selectors">
              <label>
                {es ? "Convocatoria" : "Call"}
                <select
                  value={call}
                  onChange={(e) => {
                    setCall(e.target.value);
                    setProjectId("");
                    setRiskId("");
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
                  }}
                >
                  <option value="">
                    {es
                      ? "Seleccione un proyecto enviado"
                      : "Select a submitted project"}
                  </option>
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
                      : "Full proposal · mitigation and ESMP"}{" "}
                  ·{" "}
                  <Link href={`/internal/applications/${project.id}`}>
                    {es ? "Ver expediente" : "View application"}
                  </Link>
                </p>
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
          key={`${free}-${projectId}-${riskId}`}
          locale={locale}
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
