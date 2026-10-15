"use client";
import type { Payload, Locale } from "@/lib/domain";
export function RiskReferenceTable({
  payload,
  locale,
  references,
  onChange,
}: {
  payload: Payload;
  locale: Locale;
  references: string[];
  onChange: (ai: number, ri: number, reference: string) => void;
}) {
  const es = locale === "es";
  return (
    <div className="table-scroll">
      <table>
        <caption>
          {es
            ? "Normas de desempeño y evaluación de riesgos"
            : "Performance standards and risk assessment"}
        </caption>
        <thead>
          <tr>
            {(es
              ? [
                  "Actividad",
                  "Riesgo",
                  "Norma de desempeño",
                  "Descripción",
                  "Probabilidad",
                  "Gravedad",
                  "Puntaje",
                ]
              : [
                  "Activity",
                  "Risk",
                  "Performance standard",
                  "Description",
                  "Probability",
                  "Severity",
                  "Score",
                ]
            ).map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payload.activities.flatMap((a, ai) =>
            a.risks.map((r, ri) => (
              <tr key={r.id}>
                <td>{a.title}</td>
                <td>{r.name}</td>
                <td>
                  <select
                    disabled={!references.length && !r.performance_standard}
                    aria-label={`${es ? "Norma de desempeño" : "Performance standard"}: ${r.name}`}
                    value={r.performance_standard || ""}
                    onChange={(e) => onChange(ai, ri, e.target.value)}
                  >
                    <option value="">
                      {references.length
                        ? es
                          ? "Seleccione la norma aplicable"
                          : "Select the applicable standard"
                        : es
                          ? "Catálogo aprobado no disponible"
                          : "Approved catalogue unavailable"}
                    </option>
                    {r.performance_standard &&
                      !references.includes(r.performance_standard) && (
                        <option value={r.performance_standard}>
                          {r.performance_standard}
                        </option>
                      )}
                    {references.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{r.description}</td>
                <td>{r.probability ?? "—"}</td>
                <td>{r.severity ?? "—"}</td>
                <td>
                  {r.probability !== null && r.severity !== null
                    ? r.probability * r.severity
                    : "—"}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
