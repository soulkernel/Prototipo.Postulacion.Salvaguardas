"use client";
import { useId, useState } from "react";
import { riskLevel, type Payload, type Locale } from "@/lib/domain";
import {
  assessmentCount,
  riskMapEntries,
  riskMapLevels,
  riskMapNames,
  riskMapRanges,
  riskMapSummary,
  riskMapText,
  type RiskMapEntry,
} from "@/lib/risk-map";

export function RiskOverview({
  payload,
  locale,
  stage = 1,
}: {
  payload: Payload;
  locale: Locale;
  stage?: number;
}) {
  const es = locale === "es";
  const copy = riskMapText[locale];
  const [dimension, setDimension] = useState("all");
  const [activityId, setActivityId] = useState("all");
  const [cell, setCell] = useState<string | null>(null);
  const [residual, setResidual] = useState(false);
  const detailId = useId();
  const all = riskMapEntries(payload, stage === 2 && residual);
  const rows = all.filter(
    ({ activity, risk }) =>
      (dimension === "all" || risk.dimension === dimension) &&
      (activityId === "all" || activity.id === activityId),
  );
  const { complete, pending, counts, text } = riskMapSummary(rows, locale);
  const selected = cell
    ? complete.filter((e) => `${e.probability}-${e.severity}` === cell)
    : complete;
  function detailTable(entries: RiskMapEntry[], title: string) {
    return (
      <div
        className="risk-map-table-wrap"
        tabIndex={0}
        role="region"
        aria-label={title}
      >
        <table className="risk-map-detail-table">
          <caption>{title}</caption>
          <thead>
            <tr>
              {[
                copy.code,
                copy.activity,
                copy.risk,
                es ? "Probabilidad" : "Probability",
                es ? "Gravedad" : "Severity",
                copy.calculation,
                copy.category,
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.activity.id + ":" + e.risk.id}>
                <th scope="row">{e.code}</th>
                <td>{e.activity.title || (es ? "Sin nombre" : "Unnamed")}</td>
                <td>{e.risk.name || (es ? "Sin nombre" : "Unnamed")}</td>
                <td>{e.probability ?? "—"}</td>
                <td>{e.severity ?? "—"}</td>
                <td>
                  {e.score === null
                    ? "—"
                    : `${e.probability} × ${e.severity} = ${e.score}`}
                </td>
                <td>
                  <span className={"risk-map-category " + e.level}>
                    {riskMapNames[locale][e.level]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <details className="risk-overview full-width">
      <summary>
        {es ? "Ver mapa de riesgos" : "View risk map"}{" "}
        <span>· {assessmentCount(all.length, locale)}</span>
      </summary>
      <h3 className="risk-map-title">
        {stage === 2 && residual ? copy.residual : copy.initial}
      </h3>
      <p className="risk-map-subtitle">
        {stage === 2 && residual ? copy.after : copy.before}
      </p>
      <p>{copy.intro}</p>
      <div className="risk-map-filters">
        {stage === 2 && (
          <label>
            {es ? "Valoración" : "Assessment"}
            <select
              value={residual ? "residual" : "initial"}
              onChange={(e) => {
                setResidual(e.target.value === "residual");
                setCell(null);
              }}
            >
              <option value="initial">
                {es ? "Riesgo inicial" : "Initial risk"}
              </option>
              <option value="residual">
                {es ? "Riesgo residual" : "Residual risk"}
              </option>
            </select>
          </label>
        )}
        <label>
          {es ? "Tipo de riesgo" : "Risk type"}
          <select
            value={dimension}
            onChange={(e) => {
              setDimension(e.target.value);
              setCell(null);
            }}
          >
            <option value="all">{es ? "Todos" : "All"}</option>
            <option value="environmental">
              {es ? "Ambientales" : "Environmental"}
            </option>
            <option value="social">{es ? "Sociales" : "Social"}</option>
          </select>
        </label>
        <label>
          {copy.activity}
          <select
            value={activityId}
            onChange={(e) => {
              setActivityId(e.target.value);
              setCell(null);
            }}
          >
            <option value="all">
              {es ? "Todas las actividades" : "All activities"}
            </option>
            {payload.activities.map((a, i) => (
              <option key={a.id} value={a.id}>
                {i + 1}. {a.title || (es ? "Sin nombre" : "Unnamed")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="risk-map-reading" role="status">
        {text}
      </p>
      <div className="risk-map-layout">
        <div className="risk-map-chart">
          <p className="risk-map-axis">
            <strong>{copy.severity} ↑</strong>
            <span>
              {copy.severityHelp} · {copy.scale}
            </span>
          </p>
          <table className="risk-map">
            <caption className="sr-only">
              {es
                ? "Matriz de probabilidad por gravedad, escala de 1 a 5. Los marcadores indican el número de evaluaciones."
                : "Probability by severity matrix, scale 1 to 5. Markers show the number of assessments."}
            </caption>
            <colgroup>
              <col className="risk-map-tick" />
              {[1, 2, 3, 4, 5].map((p) => (
                <col key={p} />
              ))}
            </colgroup>
            <tbody>
              {[5, 4, 3, 2, 1].map((s) => (
                <tr key={s}>
                  <th scope="row">{s}</th>
                  {[1, 2, 3, 4, 5].map((p) => {
                    const count = complete.filter(
                      (e) => e.probability === p && e.severity === s,
                    ).length;
                    const key = `${p}-${s}`;
                    return (
                      <td key={p} className={"risk-cell " + riskLevel(p * s)}>
                        <button
                          type="button"
                          disabled={!count}
                          aria-pressed={cell === key}
                          aria-controls={detailId}
                          aria-label={`${es ? "Probabilidad" : "Probability"} ${p}, ${es ? "gravedad" : "severity"} ${s}, ${riskMapNames[locale][riskLevel(p * s)]}, ${assessmentCount(count, locale)}`}
                          onClick={() => setCell(cell === key ? null : key)}
                        >
                          {count > 0 && (
                            <span className="risk-cell-marker">
                              <strong>{count}</strong>
                              <small>
                                {es
                                  ? count === 1
                                    ? "evaluación"
                                    : "evaluaciones"
                                  : count === 1
                                    ? "assessment"
                                    : "assessments"}
                              </small>
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                {[1, 2, 3, 4, 5].map((p) => (
                  <th scope="col" key={p}>
                    {p}
                  </th>
                ))}
              </tr>
            </tfoot>
          </table>
          <p className="risk-map-axis risk-map-axis-bottom">
            <strong>{copy.probability} →</strong>
            <span>
              {copy.probabilityHelp} · {copy.scale}
            </span>
          </p>
        </div>
        <div
          className="risk-map-legend"
          aria-label={
            es ? "Evaluaciones por categoría" : "Assessments by category"
          }
        >
          {riskMapLevels.map((level) => (
            <div className={"risk-map-category " + level} key={level}>
              <strong>
                {riskMapNames[locale][level]}: {counts[level]}
              </strong>
              <span>
                {copy.range} {riskMapRanges[level]} ·{" "}
                {es ? "evaluaciones" : "assessments"}
              </span>
            </div>
          ))}
          <p className="field-help">{copy.formula}</p>
        </div>
      </div>
      <p className="field-help">
        {copy.markers}{" "}
        {es
          ? "Seleccione una casilla ocupada para consultar su detalle."
          : "Select an occupied cell to view its details."}
      </p>
      <p className="risk-map-pending">
        {copy.pending}: <strong>{pending.length}</strong>
      </p>
      <p className="field-help">{copy.scope}</p>
      <div id={detailId}>
        {cell && (
          <button
            className="button"
            type="button"
            onClick={() => setCell(null)}
          >
            {copy.all}
          </button>
        )}
        {selected.length > 0 &&
          detailTable(selected, cell ? copy.selected : copy.detail)}
        {pending.length > 0 && detailTable(pending, copy.pendingDetail)}
      </div>
    </details>
  );
}
