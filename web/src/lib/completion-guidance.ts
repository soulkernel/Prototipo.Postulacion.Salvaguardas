import { activityDateErrors, activityDateMessage } from "./activity-planning";
import {
  generalOnlyAlignment,
  requiresObjectiveContribution,
} from "./strategic-alignment";
import { applicationTopicIssue, applicationTopicMessage } from "./call-themes";
import { stepIssues } from "./step-validation";
import {
  validateComplete,
  type Payload,
  type Rules,
  type Call,
  type Locale,
} from "./domain";
import { identityFields, narrativeFields } from "./fields";
export type CompletionIssue = {
  id: string;
  step: number;
  text: string;
  selector: string;
  fieldLabel?: string;
};
export function completionGuidance(
  payload: Payload,
  rules: Rules,
  stage: number,
  phase2: Call["phase2_schema"],
  locale: Locale,
): CompletionIssue[] {
  const es = locale === "es",
    out: CompletionIssue[] = [];
  const add = (
    id: string,
    step: number,
    text: string,
    selector: string,
    fieldLabel?: string,
  ) => out.push({ id, step, text, selector, fieldLabel });
  const field = (key: string) => `[data-validation-field="${key}"]`;
  const issues = [0, 1, 2].map((s) =>
    stepIssues(payload, rules, stage, s, phase2),
  );
  const keys = [
    ...new Set([
      ...issues.flatMap((x) => [...x.missing, ...x.invalid]),
      ...validateComplete(payload, rules, stage),
    ]),
  ];
  const alignment = payload.concept.strategic_alignment;
  keys.forEach((key) => {
    if (key === "other_instruments") return; // Individual missing fields are identified below.
    if (key.startsWith("budget_")) {
      add(
        key,
        0,
        es
          ? "Presupuesto: revise descripciones, años y concordancia de los totales."
          : "Budget: check descriptions, years and matching totals.",
        field("budget"),
      );
      return;
    }
    if (
      /^(risk_\d|quarters_|activity_\d|activity_dates_|activity_objectives_|result_)/.test(
        key,
      ) ||
      key === "declarations"
    )
      return;
    if (alignment && ["alignment", "objectives"].includes(key)) return;
    if (key.startsWith("summary:")) {
      add(
        "summary",
        1,
        es ? "Resumen del proyecto" : "Project summary",
        field("summary"),
      );
      return;
    }
    const f = [...identityFields, ...narrativeFields].find(
      (x) => x.key === key,
    );
    const names: Record<string, string> = {
      identity_number: es
        ? "Cédula de identidad (10 dígitos)"
        : "Identity card number (10 digits)",
      residence_number: es
        ? "Número de credencial de residencia permanente"
        : "Permanent residence card number",
      ruc: es
        ? "RUC de la organización (13 dígitos)"
        : "Organization RUC (13 digits)",
      applicant_type: es ? "Tipo de solicitante" : "Applicant type",
      category_id: es ? "Categoría de subvención" : "Grant category",
      activities: es
        ? "Agregue al menos una actividad"
        : "Add at least one activity",
      risk_unlinked: es
        ? "Vincule los riesgos registrados con sus actividades"
        : "Link registered risks to activities",
      potential_risks: es
        ? "Complete los riesgos registrados"
        : "Complete registered risks",
      summary_word_limit: es
        ? "Reduzca el resumen al límite de palabras"
        : "Reduce the summary to the word limit",
    };
    const step =
      identityFields.some((x) => x.key === key) ||
      [
        "applicant_type",
        "category_id",
        "residence_number",
        "identity_number",
        "ruc",
      ].includes(key)
        ? 0
        : key === "activities" ||
            key.startsWith("no_risks_reason") ||
            key === "risk_unlinked"
          ? 2
          : 1;
    let text = f?.[es ? "es" : "en"] || names[key];
    if (key === "partners")
      text = es
        ? "Complete el nombre y el apoyo en la implementación de cada organización asociada."
        : "Complete the name and implementation support of each partner organization.";
    if (key === "project_type") {
      const issue = applicationTopicIssue(payload.concept.project_type, rules);
      if (issue) text = applicationTopicMessage(issue, locale);
    }
    let selector = field(key);
    if (key.startsWith("no_risks_reason_")) {
      const n = Number(key.split("_").at(-1));
      text =
        (es ? "Actividad " : "Activity ") +
        n +
        (es
          ? ": justifique la ausencia de riesgos"
          : ": explain why there are no risks");
      selector = `[data-validation-activity="${n}"]`;
    }
    if (key.startsWith("phase2:")) {
      const f2 = phase2.find((x) => x.id === key.slice(7));
      text = f2?.[es ? "label_es" : "label_en"] || key;
    }
    if (key === "summary_word_limit") selector = field("summary");
    if (key === "risk_unlinked") selector = ".risk-overview";
    if (key === "potential_risks") selector = ".potential-risk-row";
    if (key === "activities") selector = "#activity-planning";
    if (key === "objectives" || key === "alignment")
      selector = ".strategic-fields";
    if (key === "environmental_risks" || key === "social_risks")
      selector = ".potential-risk-row";
    if (key === "results" && payload.concept.project_results?.length) return;
    if (text) add(key, step, text, selector);
  });
  if (alignment) {
    let n = 0;
    alignment.objectives.forEach((o) => {
      if (o.kind === "general")
        for (const item of o.other_instruments || []) {
          for (const key of ["name", "objective"] as const)
            if (!item[key].trim()) {
              add(
                `other-instrument-${key}-${item.id}`,
                1,
                es
                  ? key === "name"
                    ? "Indique el nombre del instrumento adicional"
                    : `Indique el objetivo del instrumento ${item.name || "adicional"}`
                  : key === "name"
                    ? "Enter the additional instrument name"
                    : `Enter the objective of the instrument ${item.name || "added"}`,
                `[id="other-instrument-${key}-${item.id}"]`,
              );
            }
        }
      const title =
        o.kind === "general"
          ? es
            ? "Objetivo general"
            : "General objective"
          : (es ? "Objetivo específico " : "Specific objective ") + ++n;
      if (!o.text.trim())
        add(
          "objective-" + o.id,
          1,
          title + (es ? ": escriba el objetivo" : ": enter the objective"),
          `[id="objective-${o.id}"]`,
        );
      if (
        requiresObjectiveContribution(alignment.version) &&
        (!generalOnlyAlignment(alignment.version) || o.kind === "general") &&
        !o.contribution?.trim()
      )
        add(
          "benefit-" + o.id,
          1,
          title +
            (es
              ? ": indique la contribución esperada"
              : ": describe the expected contribution"),
          `[id="benefit-${o.id}"]`,
        );
      if (
        (!generalOnlyAlignment(alignment.version) || o.kind === "general") &&
        !(o.plan.length || o.ods.length || o.glf.length)
      )
        add(
          "align-" + o.id,
          1,
          title +
            (es
              ? ": seleccione al menos una referencia estratégica"
              : ": select at least one strategic reference"),
          `[id="plan-${o.id}"]`,
        );
    });
    if (!n)
      add(
        "specific-objectives",
        1,
        es
          ? "Agregue al menos un objetivo específico"
          : "Add at least one specific objective",
        ".strategic-fields",
      );
    for (const key of (generalOnlyAlignment(alignment.version)
      ? ["plan", "ods"]
      : ["plan", "ods", "glf"]) as ("plan" | "ods" | "glf")[])
      if (
        !alignment.objectives.some(
          (o) =>
            (!generalOnlyAlignment(alignment.version) ||
              o.kind === "general") &&
            o[key].length,
        )
      )
        add(
          "coverage-" + key,
          1,
          (es
            ? "Incluya al menos una alineación con "
            : "Include at least one alignment with ") +
            {
              plan: "Plan Galápagos 2030",
              ods: "ODS",
              glf: es
                ? "las prioridades estratégicas del GLF"
                : "GLF strategic priorities",
            }[key],
          `.strategic-objective [id^="${key}-"]`,
        );
  }
  payload.activities.forEach((a, ai) => {
    const prefix = (es ? "Actividad " : "Activity ") + (ai + 1),
      scope = `[data-validation-activity="${ai + 1}"]`;
    for (const [key, issue] of Object.entries(
      activityDateErrors(a, payload.concept),
    ))
      add(
        `activity-${ai}-${key}`,
        1,
        `${prefix}: ${activityDateMessage(issue!, locale)}`,
        `#activity-planning ${scope} ${field(`activity_${key}`)}`,
      );
    for (const key of ["title", "description"] as const)
      if (!a[key].trim())
        add(
          `activity-${ai}-${key}`,
          1,
          prefix +
            (key === "title"
              ? es
                ? ": escriba el nombre"
                : ": enter the name"
              : es
                ? ": escriba la descripción"
                : ": enter the description"),
          `#activity-planning ${scope} ${field(key)}`,
        );
    if (
      alignment &&
      (!a.objective_ids?.length ||
        a.objective_ids.some(
          (id) =>
            !alignment.objectives.some(
              (o) => o.id === id && o.kind === "specific" && o.text.trim(),
            ),
        ))
    )
      add(
        `activity-${ai}-objectives`,
        1,
        prefix +
          (es
            ? ": seleccione sus objetivos específicos"
            : ": select its specific objectives"),
        `#activity-planning ${scope} .activity-objective-option`,
      );
    a.risks.forEach((r, ri) => {
      const target = `[data-validation-risk="${ai + 1}-${ri + 1}"]`,
        label = prefix + " → " + (es ? "Riesgo " : "Risk ") + (ri + 1);
      const fields: [string, string, string][] = [
        ["name", "nombre del riesgo", "risk name"],
        ["description", "descripción del riesgo", "risk description"],
        [
          "probability",
          "probabilidad de ocurrencia",
          "probability of occurrence",
        ],
        ["severity", "gravedad del riesgo", "risk severity"],
      ];
      if (stage === 2)
        fields.push(
          ["location", "ubicación", "location"],
          ["responsible", "responsable", "responsible person"],
          [
            "residual_probability",
            "probabilidad residual",
            "residual probability",
          ],
          ["residual_severity", "gravedad residual", "residual severity"],
          ["cost", "costo", "cost"],
          ["start_quarter", "trimestre de inicio", "start quarter"],
          ["end_quarter", "trimestre de finalización", "end quarter"],
        );
      for (const [key, esName, enName] of fields) {
        const value = r[key as keyof typeof r];
        if (value === null || (typeof value === "string" && !value.trim()))
          add(
            `risk-${ai}-${ri}-${key}`,
            2,
            label +
              ": " +
              (es ? "complete " : "complete ") +
              (es ? esName : enName),
            `${target} ${field(key)}`,
          );
      }
      if (
        stage === 2 &&
        (!r.measures.length ||
          r.measures.some((m) => !m.catalog_id && !m.text?.trim()))
      )
        add(
          `risk-${ai}-${ri}-measures`,
          2,
          label +
            (es
              ? ": complete las medidas de mitigación"
              : ": complete mitigation measures"),
          target + " .measure-section",
        );
      if (
        stage === 2 &&
        r.start_quarter &&
        r.end_quarter &&
        r.end_quarter < r.start_quarter
      )
        add(
          `risk-${ai}-${ri}-quarters`,
          2,
          label +
            (es
              ? ": la finalización no puede preceder al inicio"
              : ": end quarter cannot precede start quarter"),
          target,
        );
      if (
        payload.concept.risk_register &&
        (!r.source_id ||
          !payload.concept.risk_register.some(
            (s) =>
              s.id === r.source_id &&
              s.name === r.name &&
              s.dimension === r.dimension,
          ))
      )
        add(
          `risk-${ai}-${ri}-source`,
          2,
          label +
            (es
              ? ": seleccione un riesgo registrado válido"
              : ": select a valid registered risk"),
          target,
        );
    });
  });
  payload.concept.project_results?.forEach((r, i) => {
    const scope = `[data-validation-result="${i + 1}"]`;
    for (const key of [
      "result",
      "objective_id",
      "indicator",
      "target",
      "unit",
      "evidence",
      ...(r.unit === "other" ? ["other_unit"] : []),
    ] as const) {
      const value = r[key as keyof typeof r];
      const bad =
        value === null ||
        (typeof value === "string" && !value.trim()) ||
        (key === "target" &&
          r.unit === "percent" &&
          r.target !== null &&
          r.target > 100) ||
        (key === "objective_id" &&
          !alignment?.objectives.some(
            (o) => o.id === value && o.kind === "specific" && o.text.trim(),
          ));
      if (bad) {
        const names: Record<string, string[]> = {
          result: ["resultado esperado", "expected result"],
          objective_id: [
            "objetivo específico asociado",
            "associated specific objective",
          ],
          indicator: ["indicador", "indicator"],
          target: [
            r.unit === "percent"
              ? "meta preliminar (porcentaje entre 0 y 100)"
              : "meta preliminar",
            r.unit === "percent"
              ? "preliminary target (percentage from 0 to 100)"
              : "preliminary target",
          ],
          unit: ["unidad", "unit"],
          evidence: ["evidencia prevista", "expected evidence"],
          other_unit: ["otra unidad", "other unit"],
        };
        add(
          `result-${i}-${key}`,
          1,
          (es ? "Resultado " : "Result ") +
            (i + 1) +
            ": " +
            names[key][es ? 0 : 1],
          scope + " " + field(key),
        );
      }
    }
  });
  for (const key of ["truthful", "consent"] as const)
    if (!payload[key])
      add(
        key,
        3,
        key === "truthful"
          ? es
            ? "Confirme la declaración de veracidad"
            : "Confirm the accuracy declaration"
          : es
            ? "Acepte el aviso de privacidad"
            : "Accept the privacy notice",
        field(key),
      );
  return out;
}
