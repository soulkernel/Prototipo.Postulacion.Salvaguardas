"use client";
import { useState } from "react";
import {
  glfLines,
  glfSource,
  planAxes,
  planPolicies,
  planSource,
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
  const [allOds, setAllOds] = useState<Record<string, boolean>>({});
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
        {legacy && (
          <details>
            <summary>
              {es ? "Texto guardado anteriormente" : "Previously saved text"}
            </summary>
            <p style={{ whiteSpace: "pre-wrap" }}>{legacy}</p>
          </details>
        )}
        <p>
          {es
            ? "Defina sus objetivos y seleccione su contribución a Plan Galápagos 2030, ODS y GLF."
            : "Define your objectives and select their contribution to Plan Galápagos 2030, SDGs and GLF."}
        </p>
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
          {es
            ? "Organizar objetivos y alineación"
            : "Organize objectives and alignment"}
        </button>
      </section>
    );
  let specific = 0;
  return (
    <section className="full-width strategic-fields">
      {value.legacy_text && (
        <details>
          <summary>
            {es ? "Consultar texto anterior" : "View previous text"}
          </summary>
          <p style={{ whiteSpace: "pre-wrap" }}>{value.legacy_text}</p>
        </details>
      )}
      <h3>
        {es
          ? "Objetivos y alineación estratégica"
          : "Objectives and strategic alignment"}
      </h3>
      <p>
        {es
          ? "Seleccione las referencias a las que contribuye cada objetivo. En conjunto, el proyecto debe vincularse a los tres marcos. Las sugerencias no constituyen una validación del GLF."
          : "Select the references to which each objective contributes. The project as a whole must address all three frameworks. Suggestions do not constitute GLF validation."}
      </p>
      {value.objectives.map((o) => {
        const suggested = suggestedOds(o.plan);
        const toggle = (key: "plan" | "glf", id: string) =>
          update(o.id, {
            [key]: o[key].includes(id)
              ? o[key].filter((x) => x !== id)
              : [...o[key], id],
          });
        return (
          <fieldset key={o.id} className="strategic-objective" style={{ marginBottom: 16 }}>
            <legend>
              <strong>
                {o.kind === "general"
                  ? es
                    ? "Objetivo general"
                    : "General objective"
                  : `${es ? "Objetivo específico" : "Specific objective"} ${++specific}`}
              </strong>
            </legend>
            <label>
              {es ? "Objetivo del proyecto *" : "Project objective *"}
              <textarea
                rows={3}
                maxLength={2000}
                value={o.text}
                onChange={(e) => update(o.id, { text: e.target.value })}
              />
            </label>
            <details open>
              <summary>
                <strong>Plan Galápagos 2030</strong> · {o.plan.length}{" "}
                {es ? "seleccionadas" : "selected"}
              </summary>
              <p>
                <small>
                  {es
                    ? "Seleccione la política que apoya su objetivo. Etiquetas resumidas."
                    : "Select the policy your objective supports. Summarized labels."}{" "}
                  <a href={planSource} target="_blank" rel="noreferrer">
                    {es ? "Consultar fuente" : "View source"}
                  </a>
                </small>
              </p>
              {planAxes.map(([id, labelEs, labelEn]) => (
                <details key={id} open={o.plan.some((p) => p.startsWith(id))}>
                  <summary>{es ? labelEs : labelEn}</summary>
                  {planPolicies
                    .filter((p) => p.id.startsWith(id))
                    .map((p) => (
                      <label
                        key={p.id}
                        style={{ display: "flex", gap: 8, margin: "8px 0" }}
                      >
                        <input
                          type="checkbox"
                          checked={o.plan.includes(p.id)}
                          onChange={() => toggle("plan", p.id)}
                        />
                        {p.id} · {p[locale]}
                      </label>
                    ))}
                </details>
              ))}
            </details>
            <details open>
              <summary>
                <strong>
                  {es
                    ? "Objetivos de Desarrollo Sostenible (ODS)"
                    : "Sustainable Development Goals (SDGs)"}
                </strong>{" "}
                · {o.ods.length}
              </summary>
              <p>
                <small>
                  {suggested.length
                    ? es
                      ? "ODS relacionados con las políticas seleccionadas, según el anexo del Plan. Confirme los que correspondan."
                      : "SDGs linked to selected policies in the Plan annex. Confirm those that apply."
                    : es
                      ? "Seleccione una política del Plan para obtener sugerencias, o consulte todos los ODS."
                      : "Select a Plan policy for suggestions, or browse all SDGs."}
                </small>
              </p>
              {sdgGoals
                .filter(
                  (g) =>
                    allOds[o.id] ||
                    suggested.includes(g.id) ||
                    o.ods.includes(g.id),
                )
                .map((g) => (
                  <label
                    key={g.id}
                    style={{ display: "flex", gap: 8, margin: "8px 0" }}
                  >
                    <input
                      type="checkbox"
                      checked={o.ods.includes(g.id)}
                      onChange={() =>
                        update(o.id, {
                          ods: o.ods.includes(g.id)
                            ? o.ods.filter((x) => x !== g.id)
                            : [...o.ods, g.id],
                        })
                      }
                    />
                    {es ? "ODS" : "SDG"} {g.id} · {g[locale]}
                    {suggested.includes(g.id)
                      ? es
                        ? " · relacionado"
                        : " · related"
                      : ""}
                  </label>
                ))}
              <button
                type="button"
                onClick={() => setAllOds({ ...allOds, [o.id]: !allOds[o.id] })}
              >
                {allOds[o.id]
                  ? es
                    ? "Mostrar sugeridos"
                    : "Show suggested"
                  : es
                    ? "Consultar los 17 ODS"
                    : "Browse all 17 SDGs"}
              </button>{" "}
              <a
                href="https://sdgs.un.org/es/goals"
                target="_blank"
                rel="noreferrer"
              >
                {es ? "Fuente ONU" : "UN source"}
              </a>
            </details>
            <details>
              <summary>
                <strong>
                  {es ? "Líneas de financiamiento GLF" : "GLF funding lines"}
                </strong>{" "}
                · {o.glf.length}
              </summary>
              <p>
                <small>
                  {es
                    ? "La selección identifica la contribución estratégica; la elegibilidad depende de las bases y prioridades de la convocatoria."
                    : "This selection identifies strategic contribution; eligibility depends on the call's rules and priorities."}{" "}
                  <a href={glfSource} target="_blank" rel="noreferrer">
                    {es ? "Consultar manual" : "View manual"}
                  </a>
                </small>
              </p>
              {glfLines.map((g) => (
                <label
                  key={g.id}
                  style={{ display: "flex", gap: 8, margin: "8px 0" }}
                >
                  <input
                    type="checkbox"
                    checked={o.glf.includes(g.id)}
                    onChange={() => toggle("glf", g.id)}
                  />
                  {g[locale]}
                </label>
              ))}
            </details>
            <label>
              {es
                ? "Contribución o beneficio esperado *"
                : "Expected contribution or benefit *"}
              <textarea
                rows={2}
                maxLength={600}
                value={o.contribution}
                placeholder={
                  es
                    ? "¿Qué resultado concreto aportará a las referencias seleccionadas?"
                    : "What concrete result will contribute to the selected references?"
                }
                onChange={(e) => update(o.id, { contribution: e.target.value })}
              />
              <small>
                {o.contribution.length}/600 {es ? "caracteres" : "characters"}
              </small>
            </label>
            {o.kind === "specific" && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    objectives: value.objectives.filter((x) => x.id !== o.id),
                  })
                }
              >
                {es
                  ? "Eliminar objetivo específico"
                  : "Remove specific objective"}
              </button>
            )}
          </fieldset>
        );
      })}
      {value.objectives.length < 11 && (
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              objectives: [...value.objectives, newObjective("specific")],
            })
          }
        >
          {es ? "Añadir objetivo específico" : "Add specific objective"}
        </button>
      )}
      {alignmentIssues(value).length > 0 && (
        <p className="help">
          {es
            ? "Complete los objetivos, su contribución y al menos una referencia de cada marco en el conjunto del proyecto. Puede guardar el borrador incompleto."
            : "Complete objectives, their contribution and at least one reference from each framework across the project. You may save an incomplete draft."}
        </p>
      )}
    </section>
  );
}
