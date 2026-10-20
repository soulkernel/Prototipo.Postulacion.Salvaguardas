"use client";
import { useState } from "react";
import {
  activityDateErrors,
  activityDateMessage,
  isActivityDate,
} from "@/lib/activity-planning";
import { proposalTitle } from "@/lib/proposal-guidance";
import { ProposalFieldGuidance } from "./proposal-field-guidance";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { LimitedTextarea } from "./limited-textarea";
import type { Payload, Locale } from "@/lib/domain";
import { newActivity } from "@/lib/domain";
import { RequiredMark } from "./required-mark";
export function ActivityPlanningFields({
  payload,
  locale,
  checked,
  onChange,
}: {
  payload: Payload;
  locale: Locale;
  checked: boolean;
  onChange: (activities: Payload["activities"]) => void;
}) {
  const [dateTouched, setDateTouched] = useState<Set<string>>(() => new Set());
  const es = locale === "es",
    objectives =
      payload.concept.strategic_alignment?.objectives.filter(
        (o) => o.kind === "specific",
      ) ?? [];
  const update = (
    index: number,
    patch: Partial<Payload["activities"][number]>,
  ) =>
    onChange(
      payload.activities.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    );
  return (
    <section className="full-width activity-planning" id="activity-planning">
      <h2>{proposalTitle("activities", locale)}</h2>
      <ProposalFieldGuidance field="activities" locale={locale} />
      {payload.activities.map((activity, i) => {
        const errors = activityDateErrors(activity, payload.concept);
        const showDates =
          checked ||
          dateTouched.has(activity.id) ||
          !!(activity.start_date && activity.end_date);
        return (
          <section
            className="activity-card"
            key={activity.id}
            data-validation-activity={i + 1}
          >
            <div className="form-card-heading">
              <h3>
                {es ? "Actividad" : "Activity"} {i + 1}
              </h3>
              <ConfirmRemoveButton
                locale={locale}
                element={`${es ? "Actividad" : "Activity"} ${i + 1}: ${activity.title || "—"}`}
                consequence={
                  es
                    ? "Se eliminarán esta actividad, su descripción y sus vínculos con objetivos. Los objetivos se conservarán."
                    : "This activity, its description and its objective links will be removed. Objectives will be kept."
                }
                disabled={activity.risks.length > 0}
                onConfirm={() =>
                  onChange(
                    payload.activities.filter((a) => a.id !== activity.id),
                  )
                }
                aria-label={`${es ? "Quitar actividad" : "Remove activity"} ${i + 1}`}
              />
            </div>
            <div className="live-form">
              <label>
                <span className="field-label">
                  {es ? "Nombre de la actividad" : "Activity name"}
                  <RequiredMark locale={locale} />
                </span>
                <input
                  data-validation-field="title"
                  value={activity.title}
                  maxLength={12000}
                  aria-required="true"
                  aria-invalid={checked && !activity.title.trim()}
                  onChange={(e) => update(i, { title: e.target.value })}
                />
              </label>
              <label>
                <span className="field-label">
                  {es
                    ? "Descripción breve de la actividad"
                    : "Brief activity description"}
                  <RequiredMark locale={locale} />
                </span>
                <LimitedTextarea
                  locale={locale}
                  data-validation-field="description"
                  placeholder={
                    es
                      ? "Describa qué hará, sus fases y los períodos previstos."
                      : "Describe what you will do, its phases and the planned schedule."
                  }
                  rows={3}
                  value={activity.description}
                  maxLength={12000}
                  aria-required="true"
                  aria-invalid={checked && !activity.description.trim()}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </label>
              <section
                className="activity-date-section"
                aria-labelledby={`activity-dates-${activity.id}`}
              >
                <h4 id={`activity-dates-${activity.id}`}>
                  {es
                    ? "Fechas preliminares de la actividad (opcionales)"
                    : "Preliminary activity dates (optional)"}
                </h4>
                <p
                  className="field-help"
                  id={`activity-dates-help-${activity.id}`}
                >
                  {es
                    ? "Puede dejar ambas fechas vacías. Si indica una, complete también la otra. Deben estar dentro del período del proyecto; las actividades pueden coincidir en el tiempo."
                    : "You may leave both dates blank. If you enter one, complete the other. Dates must fall within the project period; activities may overlap."}
                </p>
                <div className="live-grid activity-date-grid">
                  {(["start_date", "end_date"] as const).map((key) => {
                    const error = showDates && errors[key];
                    const inputId = `activity-${activity.id}-${key}`;
                    return (
                      <div key={key}>
                        <label htmlFor={inputId}>
                          <span className="field-label">
                            {key === "start_date"
                              ? es
                                ? "Fecha prevista de inicio"
                                : "Planned start date"
                              : es
                                ? "Fecha prevista de finalización"
                                : "Planned end date"}
                            {!!activity[
                              key === "start_date" ? "end_date" : "start_date"
                            ] && <RequiredMark locale={locale} />}
                          </span>
                        </label>
                        <input
                          id={inputId}
                          type="date"
                          data-validation-field={`activity_${key}`}
                          value={activity[key] || ""}
                          min={
                            isActivityDate(payload.concept.start_date)
                              ? payload.concept.start_date
                              : undefined
                          }
                          max={
                            isActivityDate(payload.concept.end_date)
                              ? payload.concept.end_date
                              : undefined
                          }
                          aria-required={
                            !!activity[
                              key === "start_date" ? "end_date" : "start_date"
                            ]
                          }
                          aria-invalid={!!error}
                          aria-describedby={`activity-dates-help-${activity.id}${error ? ` ${inputId}-error` : ""}`}
                          onBlur={() =>
                            setDateTouched(
                              (previous) => new Set([...previous, activity.id]),
                            )
                          }
                          onChange={(e) => update(i, { [key]: e.target.value })}
                        />
                        {error && (
                          <small
                            id={`${inputId}-error`}
                            className="field-warning"
                            role="alert"
                          >
                            {activityDateMessage(error, locale)}
                          </small>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              <section role="group" className="strategic-fields">
                <h3 className="section-card-title">
                  {es
                    ? "Objetivos específicos a los que contribuye"
                    : "Specific objectives this activity contributes to"}
                  <RequiredMark locale={locale} />
                </h3>
                {objectives.map((o, n) => (
                  <label className="activity-objective-option" key={o.id}>
                    <input
                      type="checkbox"
                      disabled={!o.text.trim()}
                      checked={activity.objective_ids?.includes(o.id) || false}
                      onChange={() =>
                        update(i, {
                          objective_ids: activity.objective_ids?.includes(o.id)
                            ? activity.objective_ids.filter((id) => id !== o.id)
                            : [...(activity.objective_ids || []), o.id],
                        })
                      }
                    />
                    <span>
                      <strong>
                        {es ? "Objetivo específico" : "Specific objective"}{" "}
                        {n + 1}:
                      </strong>{" "}
                      {o.text.trim() ||
                        (es
                          ? "Complete el texto del objetivo antes de seleccionarlo."
                          : "Complete the objective text before selecting it.")}
                    </span>
                  </label>
                ))}
                {!objectives.length && (
                  <p>
                    {es
                      ? "Defina los objetivos específicos en la sección anterior."
                      : "Define your specific objectives in the preceding section."}
                  </p>
                )}
                {checked &&
                  objectives.length > 0 &&
                  !activity.objective_ids?.length && (
                    <p role="alert" className="danger-text">
                      {es
                        ? "Seleccione al menos un objetivo específico."
                        : "Select at least one specific objective."}
                    </p>
                  )}
              </section>
              {activity.risks.length > 0 && (
                <p className="field-help">
                  {es
                    ? "Esta actividad ya tiene riesgos asociados. Si cambia su contenido, revise también su screening. Para quitarla, primero quite los riesgos asociados en el screening."
                    : "This activity already has associated risks. If you change its content, review its screening too. To remove it, first remove its associated risks in the screening."}
                </p>
              )}
            </div>
          </section>
        );
      })}
      {checked && !payload.activities.length && (
        <p role="alert" className="danger-text">
          {es
            ? "Agregue al menos una actividad."
            : "Add at least one activity."}
        </p>
      )}
      <button
        type="button"
        className="button secondary"
        disabled={payload.activities.length >= 100}
        onClick={() => onChange([...payload.activities, newActivity()])}
      >
        + {es ? "Agregar actividad" : "Add activity"}
      </button>
    </section>
  );
}
