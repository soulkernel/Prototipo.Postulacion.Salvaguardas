"use client";
import { useId, useState } from "react";
import { proposalTitle } from "@/lib/proposal-guidance";
import { ProposalFieldGuidance } from "./proposal-field-guidance";
import { narrativeTextForEditing } from "@/lib/concept-presentation";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { LimitedTextarea } from "./limited-textarea";
import { NarrativeTextarea } from "./narrative-textarea";
import { RequiredMark } from "./required-mark";
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
  onLegacyChange,
}: {
  value?: ProjectResult[];
  legacy: string;
  objectives: { id: string; kind: string; text: string }[];
  es: boolean;
  onChange: (value: ProjectResult[]) => void;
  onLegacyChange: (value: string) => void;
}) {
  const id = useId();
  const [emptyResult, setEmptyResult] = useState(newProjectResult);
  // The first empty card is a view only; it is persisted after an explicit edit.
  const rows = value === undefined ? [] : value.length ? value : [emptyResult];
  const specific = objectives.filter((o) => o.kind === "specific");
  const update = (index: number, patch: Partial<ProjectResult>) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  return (
    <section
      className="result-fields full-width"
      data-validation-field="results"
    >
      <h3>{proposalTitle("results", es ? "es" : "en")}</h3>
      <ProposalFieldGuidance field="results" locale={es ? "es" : "en"} />
      {value === undefined ? (
        <>
          <div className="narrative-field">
            <label htmlFor={`${id}-results`}>
              <span className="field-label">
                {es
                  ? "Resultados previstos y entregables"
                  : "Expected outcomes and deliverables"}
                <RequiredMark locale={es ? "es" : "en"} />
              </span>
            </label>
            <small className="field-help" id={`${id}-results-help`}>
              {es
                ? "Puede corregir o ampliar este texto. Describa qué espera conseguir al finalizar el proyecto, qué entregará y cómo comprobará esos resultados."
                : "You can edit or expand this text. Describe what you expect to achieve by project end, what you will deliver and how you will verify the outcomes."}
            </small>
            <NarrativeTextarea
              id={`${id}-results`}
              label={
                es
                  ? "Resultados previstos y entregables"
                  : "Expected outcomes and deliverables"
              }
              value={narrativeTextForEditing(legacy)}
              onChange={onLegacyChange}
              locale={es ? "es" : "en"}
              descriptionId={`${id}-results-help`}
              placeholder={
                es
                  ? "Escriba aquí los resultados que espera conseguir y lo que entregará el proyecto."
                  : "Write the expected project outcomes and deliverables here."
              }
            />
          </div>
          <div className="field-help">
            <p>
              {es
                ? "Si desea registrar cada resultado con su objetivo, indicador y meta, puede organizarlo en fichas. El texto actual se conservará como referencia; complete las fichas con la información correspondiente."
                : "To record each outcome with its objective, indicator and target, you can organize it into individual cards. The current text will be kept for reference; complete the cards with the relevant information."}
            </p>
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => onChange([emptyResult])}
          >
            {es
              ? "Organizar en resultados individuales (opcional)"
              : "Organize into individual results (optional)"}
          </button>
        </>
      ) : (
        <>
          {legacy && (
            <details>
              <summary>
                {es ? "Consultar texto anterior" : "View previous text"}
              </summary>
              <p className="preserve-text">{narrativeTextForEditing(legacy)}</p>
            </details>
          )}
          {rows.map((r, i) => (
            <section
              role="group"
              className="activity-card"
              key={r.id}
              data-validation-result={i + 1}
            >
              <div className="form-card-heading">
                <h3 className="section-card-title">
                  {es ? "Resultado" : "Result"} {i + 1}
                </h3>
                {value.length > 0 && (
                  <ConfirmRemoveButton
                    locale={es ? "es" : "en"}
                    element={`${es ? "Resultado" : "Result"} ${i + 1}: ${r.result || "—"}`}
                    consequence={
                      es
                        ? "Se eliminarán este resultado, su indicador, meta, unidad, evidencia prevista y vínculo con el objetivo. El objetivo se conservará. El texto anterior, si existe, seguirá disponible para consulta."
                        : "This result, its indicator, target, unit, expected evidence and objective link will be removed. The objective will be kept. Previous text, if any, will remain available for reference."
                    }
                    onConfirm={() => {
                      const remaining = value.filter((_, j) => i !== j);
                      if (!remaining.length) setEmptyResult(newProjectResult());
                      onChange(remaining);
                    }}
                    aria-label={`${es ? "Quitar resultado" : "Remove result"} ${i + 1}`}
                  />
                )}
              </div>
              <label>
                <span className="field-label">
                  {es ? "Resultado esperado" : "Expected result"} *
                </span>
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
                <small className="field-help">
                  {es
                    ? "Describa qué cambiará o qué producto, material, infraestructura o capacidad quedará al finalizar el proyecto."
                    : "Describe what will change or what product, material, infrastructure or capacity will be in place at project end."}
                </small>
              </label>
              <label>
                <span className="field-label">
                  {es
                    ? "Objetivo específico asociado"
                    : "Associated specific objective"}{" "}
                  *
                </span>
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
                <small className="field-help">
                  {es
                    ? "Seleccione el objetivo específico al que contribuye este resultado."
                    : "Select the specific objective this result contributes to."}
                </small>
              </label>
              <label>
                <span className="field-label">
                  {es ? "Indicador" : "Indicator"} *
                </span>
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
                <small className="field-help">
                  {es
                    ? "Indique qué observará o medirá para comprobar el resultado."
                    : "State what you will observe or measure to verify the result."}
                </small>
              </label>
              <div className="form-grid">
                <label>
                  <span className="field-label">
                    {es ? "Meta preliminar" : "Preliminary target"} *
                  </span>
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
                  <small className="field-help">
                    {es
                      ? "Indique una cantidad preliminar y seleccione su unidad de medida."
                      : "Enter a preliminary quantity and select its unit of measure."}
                  </small>
                </label>
                <label>
                  <span className="field-label">
                    {es ? "Unidad de medida" : "Unit of measure"} *
                  </span>
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
                  <span className="field-label">
                    {es ? "Especifique la unidad" : "Specify the unit"} *
                  </span>
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
                <span className="field-label">
                  {es ? "Evidencia prevista" : "Expected evidence"} *
                </span>
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
                <small className="field-help">
                  {es
                    ? "Indique el documento, registro o producto que permitirá comprobar el resultado."
                    : "State which document, record or product will provide evidence of the result."}
                </small>
              </label>
            </section>
          ))}
          <button
            type="button"
            className="button secondary"
            disabled={value.length >= 30}
            onClick={() => onChange([...rows, newProjectResult()])}
          >
            {es ? "+ Agregar otro resultado" : "+ Add another result"}
          </button>
        </>
      )}
    </section>
  );
}
