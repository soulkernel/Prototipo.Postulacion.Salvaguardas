"use client";
import { useState } from "react";
import { riskScore, riskLevel, type Payload, type Locale } from "@/lib/domain";
import { riskLabel } from "@/lib/potential-risks";
const names = {
  es: {
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    very_high: "Muy alto",
    incomplete: "Sin completar",
  },
  en: {
    low: "Low",
    medium: "Medium",
    high: "High",
    very_high: "Very high",
    incomplete: "Incomplete",
  },
};
export function RiskOverview({
  payload,
  locale,
}: {
  payload: Payload;
  locale: Locale;
}) {
  const es = locale === "es";
  const [dimension, setDimension] = useState("all");
  const [activityId, setActivityId] = useState("all");
  const [cell, setCell] = useState<string | null>(null);
  const all = payload.activities.flatMap((activity, ai) =>
    activity.risks.map((risk, ri) => ({ activity, ai, risk, ri })),
  );
  const rows = all.filter(
    ({ activity, risk }) =>
      (dimension === "all" || risk.dimension === dimension) &&
      (activityId === "all" || activity.id === activityId),
  );
  const complete = rows.filter(
    ({ risk }) => riskScore(risk.probability, risk.severity) !== null,
  );
  const selected = complete.filter(
    ({ risk }) => `${risk.probability}-${risk.severity}` === cell,
  );
  return (
    <details className="risk-overview full-width">
      <summary>
        {es ? "Ver mapa de riesgos" : "View risk map"}{" "}
        <span>
          · {all.length} {es ? "evaluaciones" : "assessments"}
        </span>
      </summary>
      <p>
        {es
          ? "Cada evaluación corresponde a un riesgo en una actividad. Seleccione una casilla con riesgos para consultar el detalle."
          : "Each assessment represents a risk in one activity. Select an occupied cell to view its details."}
      </p>
      <div className="risk-map-filters">
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
          {es ? "Actividad" : "Activity"}
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
      <p className="field-help">
        {complete.length} {es ? "completas" : "complete"} ·{" "}
        {rows.length - complete.length}{" "}
        {es ? "por calificar" : "awaiting assessment"}
      </p>
      <div className="risk-map-layout">
        <div>
          <p className="risk-map-axis">
            {es ? "Gravedad del riesgo ↑" : "Risk severity ↑"}
          </p>
          <table className="risk-map">
            <caption className="sr-only">
              {es
                ? "Matriz de probabilidad por gravedad, escala de 1 a 5"
                : "Probability by severity matrix, scale 1 to 5"}
            </caption>
            <tbody>
              {[5, 4, 3, 2, 1].map((s) => (
                <tr key={s}>
                  <th scope="row">{s}</th>
                  {[1, 2, 3, 4, 5].map((p) => {
                    const count = complete.filter(
                      ({ risk }) =>
                        risk.probability === p && risk.severity === s,
                    ).length;
                    const key = `${p}-${s}`;
                    return (
                      <td key={p} className={"risk-cell " + riskLevel(p * s)}>
                        <button
                          type="button"
                          disabled={!count}
                          aria-pressed={cell === key}
                          aria-label={`${es ? "Probabilidad" : "Probability"} ${p}, ${es ? "gravedad" : "severity"} ${s}, ${names[locale][riskLevel(p * s)]}, ${count} ${es ? "evaluaciones" : "assessments"}`}
                          onClick={() => setCell(cell === key ? null : key)}
                        >
                          <span>{p * s}</span>
                          {count > 0 && (
                            <strong className="risk-cell-count">{count}</strong>
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
          <p className="risk-map-axis">
            {es
              ? "Probabilidad de ocurrencia →"
              : "Probability of occurrence →"}
          </p>
        </div>
        <div className="risk-map-legend">
          {(["low", "medium", "high", "very_high"] as const).map((level, i) => (
            <span className={"risk-result " + level} key={level}>
              {names[locale][level]} · {["1–4", "5–9", "10–15", "16–25"][i]}
            </span>
          ))}
          <small>
            {es
              ? "El número del círculo indica cuántas evaluaciones coinciden en la casilla."
              : "The circle shows how many assessments share a cell."}
          </small>
        </div>
      </div>
      {selected.length > 0 && (
        <ul className="risk-map-details">
          {selected.map(({ activity, ai, risk, ri }) => (
            <li key={activity.id + ":" + risk.id}>
              <strong>
                {risk.source_id
                  ? riskLabel(
                      payload.concept.risk_register || [],
                      risk.source_id,
                      locale,
                    )
                  : `${es ? "Riesgo" : "Risk"} ${ai + 1}.${ri + 1}`}
              </strong>
              <p>{risk.name}</p>
              <small>
                {es ? "Actividad" : "Activity"} {ai + 1}: {activity.title}
              </small>
              <p>
                {risk.probability} × {risk.severity} ={" "}
                {riskScore(risk.probability, risk.severity)} ·{" "}
                {
                  names[locale][
                    riskLevel(riskScore(risk.probability, risk.severity))
                  ]
                }
              </p>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
