"use client";
import { useId } from "react";
import { proposalTitle } from "@/lib/proposal-guidance";
import { ProposalFieldGuidance } from "./proposal-field-guidance";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { RequiredMark } from "./required-mark";
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
  type StrategicAlignment,
  type ProjectObjective,
} from "@/lib/strategic-alignment";
export function StrategicFields({
  value,
  legacy,
  locale,
  onChange,
  monitoredObjectives = [],
  sustainabilityObjectives = [],
}: {
  value: StrategicAlignment | undefined;
  legacy: string;
  locale: "es" | "en";
  onChange: (value: StrategicAlignment) => void;
  monitoredObjectives?: string[];
  sustainabilityObjectives?: string[];
}) {
  const es = locale === "es";
  const specificId = useId();
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
        <h3 className="application-section-title">
          {es
            ? proposalTitle("objectives", "es")
            : proposalTitle("objectives", "en")}
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
  const renderObjective = (o: ProjectObjective) => {
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
      const remaining = items.filter((i) => !selected.includes(String(i.id)));
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
              if (key === "ods") update(o.id, { ods: [...o.ods, Number(id)] });
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
                    remaining.filter((i) => !related.includes(Number(i.id))),
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
      <section
        role="group"
        className="strategic-objective"
        key={o.id}
        aria-labelledby={`objective-title-${o.id}`}
      >
        <div className="form-card-heading">
          <h3 className="section-card-title" id={`objective-title-${o.id}`}>
            <label htmlFor={`objective-${o.id}`}>
              {title}
              <RequiredMark locale={locale} />
            </label>
          </h3>
          {o.kind === "specific" && (
            <ConfirmRemoveButton
              locale={locale}
              element={`${title}: ${o.text || "—"}`}
              consequence={
                (es
                  ? "Se eliminará este objetivo y se retirarán sus vínculos con actividades y resultados. Las actividades y los resultados se conservarán; revise su asociación con otro objetivo."
                  : "This objective and its links to activities and results will be removed. Activities and results will be kept; review their links to another objective.") +
                (monitoredObjectives.includes(o.id)
                  ? es
                    ? " Las fichas de seguimiento relacionadas se conservarán y requerirán revisar los objetivos de sus referencias."
                    : " Related monitoring cards will be kept and the objectives of their references will need review."
                  : "") +
                (sustainabilityObjectives.includes(o.id)
                  ? es
                    ? " Las estrategias de sostenibilidad relacionadas se conservarán; deberá revisar los objetivos de sus registros asociados."
                    : " Related sustainability strategies will be kept; review the objectives of their associated records."
                  : "")
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
        </div>
        <div
          className={
            o.kind === "general"
              ? "strategic-objective-row"
              : "strategic-objective-text"
          }
        >
          <div className="strategic-objective-text">
            <LimitedTextarea
              locale={locale}
              id={`objective-${o.id}`}
              aria-required="true"
              rows={4}
              maxLength={2000}
              value={o.text}
              placeholder={
                o.kind === "general"
                  ? es
                    ? "Escriba aquí el objetivo general."
                    : "Write the general objective here."
                  : es
                    ? "Escriba aquí este objetivo"
                    : "Write this objective here"
              }
              onChange={(e) => update(o.id, { text: e.target.value })}
            />
          </div>
          {o.kind === "general" && (
            <div className="strategic-objective-selectors">
              <div className="strategic-alignment-guidance">
                <h4>{proposalTitle("alignment", locale)}</h4>
                <ProposalFieldGuidance field="alignment" locale={locale} />
              </div>
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
      </section>
    );
  };
  return (
    <section className="full-width strategic-fields">
      <h3 className="application-section-title">
        {es
          ? proposalTitle("objectives", "es")
          : proposalTitle("objectives", "en")}
      </h3>
      <ProposalFieldGuidance field="objectives" locale={locale} />
      {value.legacy_text && (
        <details>
          <summary>
            {es ? "Consultar texto anterior" : "View previous text"}
          </summary>
          <p style={{ whiteSpace: "pre-wrap" }}>{value.legacy_text}</p>
        </details>
      )}
      {value.objectives
        .filter((o) => o.kind === "general")
        .map(renderObjective)}
      <section
        className="specific-objectives"
        aria-labelledby={`${specificId}-title`}
      >
        <div className="specific-objectives-heading">
          <h3 id={`${specificId}-title`}>
            {es ? "Objetivos específicos" : "Specific objectives"}
          </h3>
          {value.objectives.length < 11 && (
            <button
              className="button secondary objective-add"
              type="button"
              aria-describedby={`${specificId}-help`}
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
              <Plus size={18} aria-hidden="true" />
              {es
                ? "Agregar objetivo específico de su proyecto"
                : "Add a specific objective for your project"}
            </button>
          )}
          <p id={`${specificId}-help`} className="field-help">
            {es
              ? "Escriba un objetivo por ficha. Indique el logro concreto que busca alcanzar y cómo contribuye al objetivo general."
              : "Write one objective per card. State the specific achievement you aim to accomplish and how it contributes to the general objective."}
          </p>
        </div>
        {value.objectives
          .filter((o) => o.kind === "specific")
          .map(renderObjective)}
      </section>
    </section>
  );
}
