"use client";
import { LimitedTextarea } from "./limited-textarea";
import {
  newProjectResult,
  resultUnits,
  type ProjectResult,
} from "@/lib/project-results";
export function ProjectResultFields({
  value,
  legacy,
  objectives,
  es,
  onChange,
}: {
  value?: ProjectResult[];
  legacy: string;
  objectives: { id: string; kind: string; text: string }[];
  es: boolean;
  onChange: (value: ProjectResult[]) => void;
}) {
  const specific = objectives.filter((o) => o.kind === "specific");
  const update = (index: number, patch: Partial<ProjectResult>) =>
    onChange(
      (value || []).map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  return (
    <section className="result-fields" data-validation-field="results">
      <h3>
        {es
          ? "Resultados e indicadores esperados"
          : "Expected results and indicators"}
      </h3>
      <p>
        {es
          ? "Indique qué espera lograr y cómo lo comprobará. Las metas son preliminares; la fórmula de cálculo y los detalles de medición se completarán en el proyecto completo."
          : "Describe what you expect to achieve and how you will verify it. Targets are preliminary; calculation formulas and measurement details will be completed in the full proposal."}
      </p>
      {value === undefined ? (
        <>
          <details>
            <summary>
              {es ? "Consultar texto existente" : "View existing text"}
            </summary>
            <p style={{ whiteSpace: "pre-wrap" }}>{legacy || "—"}</p>
          </details>
          <button type="button" onClick={() => onChange([newProjectResult()])}>
            {es ? "Organizar resultados" : "Organise results"}
          </button>
        </>
      ) : (
        <>
          {legacy && (
            <details>
              <summary>
                {es ? "Consultar texto anterior" : "View previous text"}
              </summary>
              <p style={{ whiteSpace: "pre-wrap" }}>{legacy}</p>
            </details>
          )}
          {value.map((r, i) => (
            <fieldset
              className="activity-card"
              key={r.id}
              data-validation-result={i + 1}
            >
              <legend>
                {es ? "Resultado" : "Result"} {i + 1}
              </legend>
              <label>
                {es ? "Resultado esperado" : "Expected result"} *
                <LimitedTextarea
                  locale={es ? "es" : "en"}
                  data-validation-field="result"
                  maxLength={2000}
                  value={r.result}
                  placeholder={
                    es
                      ? "Ej.: Jóvenes con conocimientos para proteger el entorno marino."
                      : "E.g. Young people equipped to protect the marine environment."
                  }
                  onChange={(e) => update(i, { result: e.target.value })}
                />
              </label>
              <label>
                {es
                  ? "Objetivo específico asociado"
                  : "Associated specific objective"}{" "}
                *
                <select
                  data-validation-field="objective_id"
                  value={r.objective_id}
                  onChange={(e) => update(i, { objective_id: e.target.value })}
                >
                  <option value="">
                    {es ? "Seleccione un objetivo" : "Select an objective"}
                  </option>
                  {r.objective_id &&
                    !specific.some((o) => o.id === r.objective_id) && (
                      <option value={r.objective_id}>
                        {es
                          ? "Objetivo eliminado: seleccione otro"
                          : "Objective removed: select another"}
                      </option>
                    )}
                  {specific.map((o, j) => (
                    <option key={o.id} value={o.id} disabled={!o.text.trim()}>
                      OE{j + 1}:{" "}
                      {o.text ||
                        (es
                          ? "Complete el objetivo"
                          : "Complete the objective")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {es ? "Indicador" : "Indicator"} *
                <input
                  data-validation-field="indicator"
                  maxLength={1000}
                  value={r.indicator}
                  placeholder={
                    es
                      ? "Ej.: Número de jóvenes que completan la capacitación."
                      : "E.g. Number of young people completing training."
                  }
                  onChange={(e) => update(i, { indicator: e.target.value })}
                />
              </label>
              <div className="form-grid">
                <label>
                  {es ? "Meta preliminar" : "Preliminary target"} *
                  <input
                    data-validation-field="target"
                    type="number"
                    min={0}
                    max={r.unit === "percent" ? 100 : 999999999999}
                    step="any"
                    value={r.target ?? ""}
                    placeholder="60"
                    onChange={(e) =>
                      update(i, {
                        target:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  {es ? "Unidad de medida" : "Unit of measure"} *
                  <select
                    data-validation-field="unit"
                    value={r.unit}
                    onChange={(e) =>
                      update(i, {
                        unit: e.target.value as ProjectResult["unit"],
                      })
                    }
                  >
                    <option value="">{es ? "Seleccione" : "Select"}</option>
                    {resultUnits.map((u) => (
                      <option key={u[0]} value={u[0]}>
                        {u[es ? 1 : 2]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {r.unit === "other" && (
                <label>
                  {es ? "Especifique la unidad" : "Specify the unit"} *
                  <input
                    data-validation-field="other_unit"
                    maxLength={100}
                    value={r.other_unit}
                    onChange={(e) => update(i, { other_unit: e.target.value })}
                  />
                </label>
              )}
              {r.unit === "percent" && r.target !== null && r.target > 100 && (
                <p role="alert">
                  {es
                    ? "La meta porcentual debe estar entre 0 y 100."
                    : "Percentage targets must be between 0 and 100."}
                </p>
              )}
              <label>
                {es ? "Evidencia prevista" : "Expected evidence"} *
                <input
                  data-validation-field="evidence"
                  maxLength={1000}
                  value={r.evidence}
                  placeholder={
                    es
                      ? "Ej.: Registro de asistencia y evaluación de aprendizaje."
                      : "E.g. Attendance records and learning assessment."
                  }
                  onChange={(e) => update(i, { evidence: e.target.value })}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => i !== j))}
              >
                {es ? "Quitar resultado" : "Remove result"} {i + 1}
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={value.length >= 30}
            onClick={() => onChange([...value, newProjectResult()])}
          >
            {es ? "+ Agregar resultado" : "+ Add result"}
          </button>
        </>
      )}
    </section>
  );
}
