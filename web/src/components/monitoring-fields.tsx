"use client";
import { useId, useState } from "react";
import type { Payload, Locale } from "@/lib/domain";
import {
  newMonitoringItem,
  monitoringReference,
  monitoringEntryIssues,
  type MonitoringItem,
} from "@/lib/monitoring-plan";
import { narrativeTextForEditing } from "@/lib/concept-presentation";
import { LimitedTextarea } from "./limited-textarea";
import { NarrativeTextarea } from "./narrative-textarea";
import { RequiredMark } from "./required-mark";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { ProposalFieldGuidance } from "./proposal-field-guidance";
import { linkedSustainabilityCount } from "@/lib/sustainability-plan";

export function MonitoringFields({
  payload,
  locale,
  checked,
  onChange,
}: {
  payload: Payload;
  locale: Locale;
  checked: boolean;
  onChange: (concept: Payload["concept"]) => void;
}) {
  const id = useId(),
    es = locale === "es";
  const [empty, setEmpty] = useState(newMonitoringItem);
  const c = payload.concept,
    value = c.monitoring_plan;
  const [legacyMode, setLegacyMode] = useState(
    value === undefined && !!c.monitoring.trim(),
  );
  const legacyOnly = value === undefined && legacyMode;
  const rows = value?.length ? value : [empty];
  const change = (plan: MonitoringItem[]) =>
    onChange({ ...c, monitoring_plan: plan });
  const update = (index: number, patch: Partial<MonitoringItem>) =>
    change(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  return (
    <section
      id="monitoring-plan"
      className="monitoring-fields full-width"
      data-validation-field="monitoring"
    >
      <h2>{es ? "Seguimiento y evaluación" : "Monitoring and evaluation"}</h2>
      <ProposalFieldGuidance field="monitoring" locale={locale} />
      {legacyOnly ? (
        <>
          <label htmlFor={`${id}-legacy`}>
            <span className="field-label">
              {es
                ? "Propuesta de seguimiento y evaluación"
                : "Proposed monitoring and evaluation"}
              <RequiredMark locale={locale} />
            </span>
          </label>
          <NarrativeTextarea
            id={`${id}-legacy`}
            label={
              es
                ? "Propuesta de seguimiento y evaluación"
                : "Proposed monitoring and evaluation"
            }
            value={narrativeTextForEditing(c.monitoring)}
            locale={locale}
            placeholder={
              es
                ? "Describa cómo dará seguimiento y qué indicadores propone."
                : "Describe how you will monitor the project and the indicators you propose."
            }
            onChange={(monitoring) => onChange({ ...c, monitoring })}
          />
          <p className="field-help">
            {es
              ? "Puede seguir editando el texto guardado. Organizarlo en fichas es opcional: se conserva el texto original y usted selecciona los vínculos, sin conversión automática."
              : "You can keep editing the saved text. Organizing it into cards is optional: the original text is retained and you select the links, without automatic conversion."}
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setLegacyMode(false);
              change([empty]);
            }}
          >
            {es
              ? "Organizar en indicadores vinculados (opcional)"
              : "Organize into linked indicators (optional)"}
          </button>
        </>
      ) : (
        <>
          {rows.map((item, i) => {
            const issues = monitoringEntryIssues(payload, item);
            const ref = monitoringReference(payload, item, locale);
            const options =
              item.parameter === "activity"
                ? payload.activities.filter((a) => a.title.trim())
                : item.parameter === "result"
                  ? c.project_results?.filter((r) => r.result.trim()) || []
                  : [];
            const missing = !!item.reference_id && ref.missing;
            const invalid = (key: (typeof issues)[number]) =>
              checked && issues.includes(key);
            return (
              <section
                role="group"
                aria-labelledby={`${id}-title-${i}`}
                className="activity-card"
                key={item.id}
                data-validation-monitoring={i + 1}
              >
                <div className="form-card-heading">
                  <h3 id={`${id}-title-${i}`}>
                    {es ? "Indicador propuesto" : "Proposed indicator"} {i + 1}
                  </h3>
                  {!!value?.length && (
                    <ConfirmRemoveButton
                      locale={locale}
                      element={`${es ? "Indicador" : "Indicator"} ${i + 1}: ${item.indicator || "—"}`}
                      consequence={
                        (es
                          ? "Se eliminarán este indicador, su estrategia de seguimiento y su vínculo. La actividad, el resultado y los objetivos asociados se conservarán."
                          : "This indicator, its monitoring strategy and its link will be removed. The activity, result and associated objectives will be kept.") +
                        (linkedSustainabilityCount(
                          payload,
                          "monitoring",
                          item.id,
                        )
                          ? es
                            ? " Las estrategias de sostenibilidad relacionadas se conservarán; deberá revisar su vínculo opcional con este indicador."
                            : " Related sustainability strategies will be kept; review their optional link to this indicator."
                          : "")
                      }
                      aria-label={`${es ? "Eliminar indicador" : "Delete indicator"} ${i + 1}`}
                      onConfirm={() => {
                        const rest = value.filter((r) => r.id !== item.id);
                        if (!rest.length) setEmpty(newMonitoringItem());
                        change(rest);
                      }}
                    />
                  )}
                </div>
                <div className="live-form">
                  <label>
                    <span className="field-label">
                      {es
                        ? "Parámetro de evaluación que propone"
                        : "Proposed evaluation parameter"}
                      <RequiredMark locale={locale} />
                    </span>
                    <select
                      data-validation-field="parameter"
                      value={item.parameter}
                      aria-required="true"
                      aria-invalid={invalid("parameter")}
                      onChange={(e) =>
                        update(i, {
                          parameter: e.target
                            .value as MonitoringItem["parameter"],
                          reference_id: "",
                        })
                      }
                    >
                      <option value="">
                        {es
                          ? "Seleccione qué propone evaluar"
                          : "Select what you propose to evaluate"}
                      </option>
                      <option value="activity">
                        {es
                          ? "Avance de una actividad"
                          : "Progress of an activity"}
                      </option>
                      <option value="result">
                        {es
                          ? "Logro de un resultado"
                          : "Achievement of an outcome"}
                      </option>
                    </select>
                    <small className="field-help">
                      {es
                        ? "Seleccione si comprobará el avance de una actividad o el logro de un resultado ya registrado."
                        : "Choose whether to assess progress of an activity or achievement of an outcome already entered."}
                    </small>
                  </label>
                  <label>
                    <span className="field-label">
                      {item.parameter === "activity"
                        ? es
                          ? "Actividad a la que dará seguimiento"
                          : "Activity to monitor"
                        : item.parameter === "result"
                          ? es
                            ? "Resultado al que dará seguimiento"
                            : "Outcome to monitor"
                          : es
                            ? "Actividad o resultado al que dará seguimiento"
                            : "Activity or outcome to monitor"}
                      <RequiredMark locale={locale} />
                    </span>
                    <select
                      data-validation-field="reference_id"
                      value={item.reference_id}
                      disabled={!item.parameter}
                      aria-required="true"
                      aria-invalid={invalid("reference_id") || missing}
                      aria-describedby={`${id}-ref-${i}`}
                      onChange={(e) =>
                        update(i, { reference_id: e.target.value })
                      }
                    >
                      <option value="">
                        {es
                          ? "Seleccione un registro ya ingresado"
                          : "Select a record already entered"}
                      </option>
                      {missing && (
                        <option value={item.reference_id}>
                          {es
                            ? "Registro eliminado: seleccione otro"
                            : "Record removed: select another"}
                        </option>
                      )}
                      {options.map((row) => {
                        const link = monitoringReference(
                          payload,
                          { ...item, reference_id: row.id },
                          locale,
                        );
                        return (
                          <option
                            key={row.id}
                            value={row.id}
                            disabled={!link.valid}
                          >
                            {link.label}
                            {!link.valid
                              ? es
                                ? " — Revise sus objetivos asociados"
                                : " — Check its associated objectives"
                              : ""}
                          </option>
                        );
                      })}
                    </select>
                    <small id={`${id}-ref-${i}`} className="field-help">
                      {!item.parameter
                        ? es
                          ? "Primero seleccione el parámetro de evaluación."
                          : "First select the evaluation parameter."
                        : !options.length
                          ? es
                            ? "Complete primero sus actividades o resultados y vincúlelos con sus objetivos específicos."
                            : "First complete your activities or outcomes and link them to their specific objectives."
                          : es
                            ? "Las opciones provienen de lo que ya ingresó; no es necesario volver a escribirlo."
                            : "Options come from the records already entered; you do not need to type them again."}
                    </small>
                  </label>
                  {item.reference_id && (
                    <div className="live-notice" aria-live="polite">
                      <strong>
                        {es
                          ? "Objetivos específicos asociados"
                          : "Associated specific objectives"}
                      </strong>
                      {ref.objectives.length ? (
                        <ul>
                          {ref.objectives.map((text, n) => (
                            <li key={n}>{text}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>
                          {es
                            ? "Revise el registro seleccionado y su vínculo con los objetivos específicos."
                            : "Review the selected record and its links to specific objectives."}
                        </p>
                      )}
                      {!ref.valid && (
                        <p role="alert">
                          {es
                            ? "La ficha conserva su información, pero debe revisar y seleccionar un vínculo válido antes de continuar."
                            : "The card retains its information, but you must review and select a valid link before continuing."}
                        </p>
                      )}
                    </div>
                  )}
                  <label>
                    <span className="field-label">
                      {es ? "Indicador propuesto" : "Proposed indicator"}
                      <RequiredMark locale={locale} />
                    </span>
                    <LimitedTextarea
                      data-validation-field="indicator"
                      locale={locale}
                      rows={3}
                      maxLength={1000}
                      value={item.indicator}
                      aria-required="true"
                      aria-invalid={invalid("indicator")}
                      placeholder={
                        item.parameter === "activity"
                          ? es
                            ? "Ej.: Número de talleres realizados."
                            : "E.g. Number of workshops delivered."
                          : es
                            ? "Indique qué observará o medirá para comprobar el logro del resultado."
                            : "State what you will observe or measure to assess achievement of the outcome."
                      }
                      onChange={(e) => update(i, { indicator: e.target.value })}
                    />
                    <small className="field-help">
                      {es
                        ? "Describa una medida observable del avance o del éxito. Las metas y el método detallado de medición se completarán en la fase de proyecto completo."
                        : "Describe an observable measure of progress or success. Targets and the detailed measurement method will be completed in the full proposal phase."}
                    </small>
                  </label>
                  <label>
                    <span className="field-label">
                      {es
                        ? "Estrategia y actividades de seguimiento"
                        : "Monitoring strategy and activities"}
                      <RequiredMark locale={locale} />
                    </span>
                    <LimitedTextarea
                      data-validation-field="strategy"
                      locale={locale}
                      rows={4}
                      maxLength={2000}
                      value={item.strategy}
                      aria-required="true"
                      aria-invalid={invalid("strategy")}
                      placeholder={
                        es
                          ? "Explique brevemente cómo dará seguimiento a este indicador."
                          : "Briefly explain how you will monitor this indicator."
                      }
                      onChange={(e) => update(i, { strategy: e.target.value })}
                    />
                    <small className="field-help">
                      {es
                        ? "Indique qué hará para observar o comprobar el indicador propuesto."
                        : "State what you will do to observe or verify the proposed indicator."}
                    </small>
                  </label>
                </div>
              </section>
            );
          })}
          <button
            type="button"
            className="button secondary"
            disabled={(value?.length || 0) >= 30}
            onClick={() => change([...rows, newMonitoringItem()])}
          >
            {es ? "+ Agregar otro indicador" : "+ Add another indicator"}
          </button>
        </>
      )}
    </section>
  );
}
