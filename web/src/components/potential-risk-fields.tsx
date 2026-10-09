"use client";
import { Plus, Trash2 } from "lucide-react";
import type { Payload, Locale } from "@/lib/domain";
import {
  riskCode,
  synchronizeRisks,
  type PotentialRisk,
} from "@/lib/potential-risks";
export function PotentialRiskFields({
  payload,
  locale,
  onChange,
}: {
  payload: Payload;
  locale: Locale;
  onChange: (p: Payload) => void;
}) {
  const es = locale === "es",
    rows = payload.concept.risk_register;
  const change = (next: PotentialRisk[]) =>
    onChange(
      synchronizeRisks({
        ...payload,
        concept: {
          ...payload.concept,
          risk_register: next,
          environmental_risks:
            rows?.some((r) => r.dimension === "environmental") ||
            next.some((r) => r.dimension === "environmental")
              ? ""
              : payload.concept.environmental_risks,
          social_risks:
            rows?.some((r) => r.dimension === "social") ||
            next.some((r) => r.dimension === "social")
              ? ""
              : payload.concept.social_risks,
        },
      }),
    );
  if (!rows)
    return (
      <section>
        <h3>
          {es
            ? "Riesgos ambientales y sociales potenciales"
            : "Potential environmental and social risks"}
        </h3>
        <p>
          {es
            ? "Organice un riesgo por caja y después selecciónelo en cada actividad para calificarlo. El texto anterior se conserva como un registro por dimensión; puede separarlo en varios riesgos."
            : "Organize one risk per field, then select it in each activity to assess it. Existing text is preserved as one entry per dimension; you can split it into several risks."}
        </p>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            const initial: PotentialRisk[] = [];
            for (const dimension of ["environmental", "social"] as const) {
              const name =
                payload.concept[
                  (dimension + "_risks") as
                    "environmental_risks" | "social_risks"
                ];
              if (name.trim())
                initial.push({
                  id: crypto.randomUUID(),
                  dimension,
                  name: name.slice(0, 2000),
                });
            }
            // Preserve longer historical narratives until the applicant edits them deliberately.
            if (
              [
                payload.concept.environmental_risks,
                payload.concept.social_risks,
              ].some((t) => t.length > 2000)
            )
              return;
            change(initial);
          }}
          disabled={[
            payload.concept.environmental_risks,
            payload.concept.social_risks,
          ].some((t) => t.length > 2000)}
        >
          <Plus size={16} />
          {es ? "Organizar riesgos individuales" : "Organize individual risks"}
        </button>
        {[
          payload.concept.environmental_risks,
          payload.concept.social_risks,
        ].some((t) => t.length > 2000) && (
          <p>
            {es
              ? "Conserve el texto previo y reduzca cada apartado a 2.000 caracteres antes de organizarlo."
              : "Keep the previous text and shorten each section to 2,000 characters before organizing it."}
          </p>
        )}
        <details>
          <summary>{es ? "Texto anterior" : "Previous text"}</summary>
          {(["environmental_risks", "social_risks"] as const).map((key) => (
            <label key={key}>
              {key === "environmental_risks"
                ? es
                  ? "Ambientales"
                  : "Environmental"
                : es
                  ? "Sociales"
                  : "Social"}
              <textarea
                rows={3}
                maxLength={12000}
                value={payload.concept[key]}
                onChange={(e) =>
                  onChange({
                    ...payload,
                    concept: { ...payload.concept, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
          <p style={{ whiteSpace: "pre-wrap" }}>
            {payload.concept.environmental_risks}
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {payload.concept.social_risks}
          </p>
        </details>
      </section>
    );
  return (
    <section>
      <h3>{es ? "Riesgos potenciales" : "Potential risks"}</h3>
      <p>
        {es
          ? "Registre un riesgo por caja. Se vinculará con las actividades donde corresponda y se calificará allí. Si no identifica riesgos de una dimensión, explique por qué."
          : "Enter one risk per field. Link it to the relevant activities and assess it there. If no risks are identified in a dimension, explain why."}
      </p>
      {(["environmental", "social"] as const).map((dimension) => (
        <fieldset key={dimension} className="strategic-objective">
          <legend>
            {dimension === "environmental"
              ? es
                ? "Riesgos ambientales potenciales"
                : "Potential environmental risks"
              : es
                ? "Riesgos sociales potenciales"
                : "Potential social risks"}
          </legend>
          {rows
            .filter((r) => r.dimension === dimension)
            .map((r) => {
              const used = payload.activities.some((a) =>
                a.risks.some((x) => x.source_id === r.id),
              );
              return (
                <div key={r.id} className="potential-risk-row">
                  <label htmlFor={"potential-" + r.id}>
                    {riskCode(rows, r.id)} *
                    <textarea
                      id={"potential-" + r.id}
                      rows={2}
                      value={r.name}
                      maxLength={2000}
                      aria-required="true"
                      onChange={(e) =>
                        change(
                          rows.map((x) =>
                            x.id === r.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <small>
                      {r.name.length}/2000 {es ? "caracteres" : "characters"}
                    </small>
                  </label>
                  <button
                    type="button"
                    className="button ghost"
                    aria-label={
                      (es ? "Quitar " : "Remove ") + riskCode(rows, r.id)
                    }
                    disabled={used}
                    title={
                      used
                        ? es
                          ? "Retire primero sus asociaciones con actividades"
                          : "Remove activity associations first"
                        : undefined
                    }
                    onClick={() => change(rows.filter((x) => x.id !== r.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                  {used && (
                    <small>
                      {es ? "Vinculado a actividades" : "Linked to activities"}
                    </small>
                  )}
                </div>
              );
            })}
          <button
            type="button"
            className="button secondary objective-add"
            disabled={rows.length >= 100}
            onClick={() =>
              change([
                ...rows,
                { id: crypto.randomUUID(), dimension, name: "" },
              ])
            }
          >
            <Plus size={16} />
            {dimension === "environmental"
              ? es
                ? "Añadir riesgo ambiental"
                : "Add environmental risk"
              : es
                ? "Añadir riesgo social"
                : "Add social risk"}
          </button>
          {!rows.some((r) => r.dimension === dimension) && (
            <label>
              {es
                ? "Justificación de ausencia de riesgos *"
                : "Explanation of no identified risks *"}
              <textarea
                rows={2}
                maxLength={12000}
                value={
                  payload.concept[
                    dimension === "environmental"
                      ? "environmental_risks"
                      : "social_risks"
                  ]
                }
                onChange={(e) =>
                  onChange({
                    ...payload,
                    concept: {
                      ...payload.concept,
                      [dimension === "environmental"
                        ? "environmental_risks"
                        : "social_risks"]: e.target.value,
                    },
                  })
                }
              />
            </label>
          )}
        </fieldset>
      ))}
    </section>
  );
}
