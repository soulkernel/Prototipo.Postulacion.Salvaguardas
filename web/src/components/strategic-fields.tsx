"use client";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { LimitedTextarea } from "./limited-textarea";
import { Plus } from "lucide-react";
import { OtherPlanningInstruments } from "./other-planning-instruments";
import {
  glfLines,
  planPolicies,
  sdgGoals,
  suggestedOds,
  newObjective,
  currentAlignmentVersion,
  generalOnlyAlignment,
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
              version: currentAlignmentVersion,
              legacy_text: legacy.trim() || undefined,
              objectives: [
                newObjective("general", currentAlignmentVersion),
                newObjective("specific", currentAlignmentVersion),
              ],
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
                    <ConfirmRemoveButton
                      locale={locale}
                      element={`${title} · ${label}: ${id} · ${items.find((i) => String(i.id) === id)?.[locale] || ""}`}
                      consequence={
                        es
                          ? "Se retirará solo este vínculo de alineación. Se conservarán el objetivo y las demás selecciones."
                          : "Only this alignment link will be removed. The objective and other selections will be kept."
                      }
                      aria-label={`${es ? "Quitar" : "Remove"} ${label} ${id} · ${title}`}
                      onConfirm={() =>
                        key === "ods"
                          ? update(o.id, {
                              ods: o.ods.filter((x) => String(x) !== id),
                            })
                          : update(o.id, {
                              [key]: o[key].filter((x) => x !== id),
                            })
                      }
                      compact
                    />
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
                  {generalOnlyAlignment(value.version) && (
                    <OtherPlanningInstruments
                      objectiveId={o.id}
                      items={o.other_instruments || []}
                      locale={locale}
                      onChange={(items) =>
                        update(o.id, { other_instruments: items })
                      }
                    />
                  )}
                </div>
              )}
            </div>
            {o.kind === "specific" && (
              <ConfirmRemoveButton
                locale={locale}
                element={`${title}: ${o.text || "—"}`}
                consequence={
                  es
                    ? "Se eliminará este objetivo y se retirarán sus vínculos con actividades y resultados. Las actividades y los resultados se conservarán; revise su asociación con otro objetivo."
                    : "This objective and its links to activities and results will be removed. Activities and results will be kept; review their links to another objective."
                }
                onConfirm={() =>
                  onChange({
                    ...value,
                    objectives: value.objectives.filter((x) => x.id !== o.id),
                  })
                }
                className="objective-remove"
                aria-label={`${es ? "Eliminar" : "Remove"} ${title}`}
              />
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
              objectives: [
                ...value.objectives,
                newObjective("specific", value.version),
              ],
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
            ? "Complete los objetivos. Para el objetivo general, seleccione Plan Galápagos 2030 y ODS. Puede guardar un borrador incompleto."
            : "Complete the objectives. For the general objective, select Plan Galápagos 2030 and SDGs. You may save an incomplete draft."}
          {alignmentIssues(value).includes("other_instruments") && (
            <span>
              {es
                ? " Complete el nombre y el objetivo de cada instrumento adicional que haya añadido."
                : " Complete the name and objective of each additional instrument you have added."}
            </span>
          )}
        </p>
      )}
    </section>
  );
}
