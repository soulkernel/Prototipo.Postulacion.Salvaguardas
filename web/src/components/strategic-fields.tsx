"use client";
import { LimitedTextarea } from "./limited-textarea";
import { Plus, X } from "lucide-react";
import {
  glfLines,
  planPolicies,
  sdgGoals,
  suggestedOds,
  newObjective,
  alignmentVersion,
  alignmentIssues,
  type StrategicAlignment,
  type ProjectObjective,
} from "@/lib/strategic-alignment";
export function StrategicFields({
  value,
  legacy,
  locale,
  onChange,
}: {
  value: StrategicAlignment | undefined;
  legacy: string;
  locale: "es" | "en";
  onChange: (value: StrategicAlignment) => void;
}) {
  const es = locale === "es";
  const update = (id: string, patch: Partial<ProjectObjective>) =>
    onChange({
      ...value!,
      objectives: value!.objectives.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    });
  if (!value)
    return (
      <section className="full-width strategic-fields">
        <h3>
          {es
            ? "Objetivos y alineación estratégica"
            : "Objectives and strategic alignment"}
        </h3>
        <details>
          <summary>
            {es ? "Consultar texto anterior" : "View previous text"}
          </summary>
          <p style={{ whiteSpace: "pre-wrap" }}>{legacy}</p>
        </details>
        <button
          type="button"
          onClick={() =>
            onChange({
              version: alignmentVersion,
              legacy_text: legacy.trim() || undefined,
              objectives: [newObjective("general"), newObjective("specific")],
            })
          }
        >
          <Plus size={16} />
          {es
            ? "Organizar objetivos y alineación"
            : "Organize objectives and alignment"}
        </button>
      </section>
    );
  let specific = 0;
  return (
    <section className="full-width strategic-fields">
      <h3>
        {es
          ? "Objetivos y alineación estratégica"
          : "Objectives and strategic alignment"}
      </h3>
      <p>
        {es
          ? "Alinee únicamente el objetivo general con el Plan Galápagos 2030 y los ODS. Ingrese los objetivos específicos por separado, sin alineación."
          : "Align only the general objective with Plan Galápagos 2030 and the SDGs. Enter specific objectives separately, without alignment."}
      </p>
      {value.legacy_text && (
        <details>
          <summary>
            {es ? "Consultar texto anterior" : "View previous text"}
          </summary>
          <p style={{ whiteSpace: "pre-wrap" }}>{value.legacy_text}</p>
        </details>
      )}
      {value.objectives.map((o) => {
        const title =
          o.kind === "general"
            ? es
              ? "Objetivo general"
              : "General objective"
            : `${es ? "Objetivo específico" : "Specific objective"} ${++specific}`;
        const related = suggestedOds(o.plan);
        const selector = (key: "plan" | "ods" | "glf", label: string) => {
          const items =
            key === "plan" ? planPolicies : key === "glf" ? glfLines : sdgGoals;
          const selected = o[key].map(String);
          const remaining = items.filter(
            (i) => !selected.includes(String(i.id)),
          );
          const options = (list: typeof remaining) =>
            list.map((i) => (
              <option key={i.id} value={i.id}>
                {key === "glf" ? "" : `${i.id} · `}
                {i[locale]}
              </option>
            ));
          return (
            <div className="alignment-selector" key={key}>
              <label htmlFor={`${key}-${o.id}`}>{label}</label>
              <select
                id={`${key}-${o.id}`}
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  if (key === "ods")
                    update(o.id, { ods: [...o.ods, Number(id)] });
                  else update(o.id, { [key]: [...o[key], id] });
                }}
              >
                <option value="">
                  {key === "plan"
                    ? es
                      ? "Seleccione un objetivo del Plan"
                      : "Select a Plan objective"
                    : key === "ods"
                      ? es
                        ? "Seleccione un ODS"
                        : "Select an SDG"
                      : es
                        ? "Seleccione una prioridad del GLF"
                        : "Select a GLF priority"}
                </option>
                {key === "ods" && related.length ? (
                  <>
                    <optgroup
                      label={
                        es
                          ? "Relacionados con el Plan seleccionado"
                          : "Related to the selected Plan"
                      }
                    >
                      {options(
                        remaining.filter((i) => related.includes(Number(i.id))),
                      )}
                    </optgroup>
                    <optgroup label={es ? "Otros ODS" : "Other SDGs"}>
                      {options(
                        remaining.filter(
                          (i) => !related.includes(Number(i.id)),
                        ),
                      )}
                    </optgroup>
                  </>
                ) : (
                  options(remaining)
                )}
              </select>
              <div className="alignment-chips">
                {selected.map((id) => (
                  <span key={id}>
                    {key === "ods" ? `${es ? "ODS" : "SDG"} ` : ""}
                    {id} · {items.find((i) => String(i.id) === id)?.[locale]}
                    <button
                      type="button"
                      aria-label={`${es ? "Quitar" : "Remove"} ${label} ${id} · ${title}`}
                      onClick={() =>
                        key === "ods"
                          ? update(o.id, {
                              ods: o.ods.filter((x) => String(x) !== id),
                            })
                          : update(o.id, {
                              [key]: o[key].filter((x) => x !== id),
                            })
                      }
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          );
        };
        return (
          <section role="group" className="strategic-objective" key={o.id}>
            <h3 className="section-card-title">{title}</h3>
            <div
              className={
                o.kind === "general"
                  ? "strategic-objective-row"
                  : "strategic-objective-text"
              }
            >
              <div className="strategic-objective-text">
                <label htmlFor={`objective-${o.id}`}>
                  <span className="field-label">{title} *</span>
                </label>
                <LimitedTextarea
                  locale={locale}
                  id={`objective-${o.id}`}
                  aria-required="true"
                  rows={4}
                  maxLength={2000}
                  value={o.text}
                  placeholder={
                    es
                      ? "Escriba aquí este objetivo"
                      : "Write this objective here"
                  }
                  onChange={(e) => update(o.id, { text: e.target.value })}
                />
                {o.kind === "general" && (
                  <>
                    <label
                      className="alignment-benefit-label"
                      htmlFor={`benefit-${o.id}`}
                    >
                      <span className="field-label">
                        {es
                          ? "Contribución o beneficio esperado *"
                          : "Expected contribution or benefit *"}
                      </span>
                    </label>
                    <LimitedTextarea
                      locale={locale}
                      id={`benefit-${o.id}`}
                      aria-required="true"
                      rows={2}
                      maxLength={600}
                      value={o.contribution}
                      placeholder={
                        es
                          ? "¿Qué resultado aportará a las referencias elegidas?"
                          : "What result will contribute to the selected references?"
                      }
                      onChange={(e) =>
                        update(o.id, { contribution: e.target.value })
                      }
                    />
                  </>
                )}
              </div>
              {o.kind === "general" && (
                <div className="strategic-objective-selectors">
                  {selector(
                    "plan",
                    es
                      ? "Alinear con el Plan Galápagos 2030"
                      : "Align with Plan Galápagos 2030",
                  )}
                  {selector(
                    "ods",
                    es ? "Alinear con los ODS" : "Align with the SDGs",
                  )}
                  <small>
                    {es
                      ? "Los ODS relacionados se muestran primero. Usted confirma cuáles corresponden."
                      : "Related SDGs are shown first. You confirm which apply."}
                  </small>
                </div>
              )}
            </div>
            {o.kind === "specific" && (
              <button
                className="objective-remove"
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    objectives: value.objectives.filter((x) => x.id !== o.id),
                  })
                }
              >
                <X size={14} />
                {es ? "Eliminar este objetivo" : "Remove this objective"}
              </button>
            )}
          </section>
        );
      })}
      {value.objectives.length < 11 && (
        <button
          className="objective-add"
          type="button"
          onClick={() =>
            onChange({
              ...value,
              objectives: [...value.objectives, newObjective("specific")],
            })
          }
        >
          <Plus size={18} />
          {es ? "Añadir objetivo específico" : "Add specific objective"}
        </button>
      )}
      {alignmentIssues(value).length > 0 && (
        <p className="help">
          {es
            ? "Complete los objetivos. Para el objetivo general, seleccione Plan Galápagos 2030 y ODS e indique la contribución esperada. Puede guardar un borrador incompleto."
            : "Complete the objectives. For the general objective, select Plan Galápagos 2030 and SDGs and describe the expected contribution. You may save an incomplete draft."}
        </p>
      )}
    </section>
  );
}
