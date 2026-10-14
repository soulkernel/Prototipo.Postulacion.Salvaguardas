"use client";
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
      <h2>
        {es
          ? "Actividades principales del proyecto"
          : "Main project activities"}
      </h2>
      <p>
        {es
          ? "Describa qué hará para alcanzar los objetivos específicos. En el siguiente paso, estas mismas actividades aparecerán para identificar y calificar sus riesgos ambientales y sociales."
          : "Describe what you will do to achieve your specific objectives. The next step will show these same activities so you can identify and assess their environmental and social risks."}
      </p>
      {payload.activities.map((activity, i) => (
        <section
          className="activity-card"
          key={activity.id}
          data-validation-activity={i + 1}
        >
          <h3>
            {es ? "Actividad" : "Activity"} {i + 1}
          </h3>
          <div className="live-form">
            <label>
              {es ? "Nombre de la actividad" : "Activity name"}
              <RequiredMark locale={locale} />
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
              {es
                ? "Descripción breve de la actividad"
                : "Brief activity description"}
              <RequiredMark locale={locale} />
              <LimitedTextarea
                locale={locale}
                data-validation-field="description"
                rows={3}
                value={activity.description}
                maxLength={12000}
                aria-required="true"
                aria-invalid={checked && !activity.description.trim()}
                onChange={(e) => update(i, { description: e.target.value })}
              />
            </label>
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
            <button
              type="button"
              className="button secondary"
              disabled={activity.risks.length > 0}
              onClick={() =>
                onChange(payload.activities.filter((a) => a.id !== activity.id))
              }
            >
              {es ? "Quitar actividad" : "Remove activity"} {i + 1}
            </button>
          </div>
        </section>
      ))}
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
