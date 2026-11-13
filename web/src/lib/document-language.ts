import {
  glfLines,
  planPolicies,
  sdgGoals,
  type ProjectObjective,
} from "./strategic-alignment";
import { riskLevel, riskScore, type Locale } from "./domain";

export function alignmentNarrative(
  objective: ProjectObjective,
  locale: Locale,
  includeContribution = true,
): string[] {
  const es = locale === "es";
  const paragraphs = [objective.text];
  if (objective.plan.length)
    paragraphs.push(
      (es
        ? `Alineación con el Plan Galápagos 2030: este objetivo contribuye a ${objective.plan.length === 1 ? "la siguiente política" : "las siguientes políticas"}: `
        : `Alignment with the Galapagos 2030 Plan: this objective contributes to the following ${objective.plan.length === 1 ? "policy" : "policies"}: `) +
        objective.plan
          .map(
            (id) =>
              `${id}: «${planPolicies.find((p) => p.id === id)?.[locale] || id}»`,
          )
          .join("; ") +
        ".",
    );
  if (objective.ods.length)
    paragraphs.push(
      (es
        ? "Contribución a los Objetivos de Desarrollo Sostenible (ODS): este objetivo se vincula con "
        : "Contribution to the Sustainable Development Goals (SDGs): this objective is linked to ") +
        objective.ods
          .map(
            (id) =>
              `${es ? "el ODS" : "SDG"} ${id}: «${sdgGoals[id - 1]?.[locale] || id}»`,
          )
          .join("; ") +
        ".",
    );
  if (objective.glf.length)
    paragraphs.push(
      (es
        ? "Alineación con las prioridades estratégicas del GLF: este objetivo contribuye a las siguientes prioridades: "
        : "Alignment with GLF strategic priorities: this objective contributes to ") +
        objective.glf
          .map(
            (id) =>
              `${id}: «${glfLines.find((p) => p.id === id)?.[locale] || id}»`,
          )
          .join("; ") +
        ".",
    );
  if (objective.kind === "general")
    for (const item of objective.other_instruments || []) {
      paragraphs.push(
        es
          ? `Según la alineación indicada por el postulante, el objetivo general también se alinea con el instrumento «${item.name.trim() || "Nombre pendiente"}», específicamente con su objetivo «${item.objective.trim() || "Objetivo pendiente"}».`
          : `According to the alignment provided by the applicant, the general objective also aligns with the instrument “${item.name.trim() || "Name pending"}”, specifically with its objective “${item.objective.trim() || "Objective pending"}”.`,
      );
    }
  if (includeContribution && objective.contribution?.trim())
    paragraphs.push(
      (es
        ? "Contribución esperada del proyecto, según el aplicante: "
        : "Expected project contribution, as described by the applicant: ") +
        objective.contribution,
    );
  return paragraphs;
}

export function riskNarrative(
  probability: number | null,
  severity: number | null,
  locale: Locale,
): string {
  const score = riskScore(probability, severity);
  if (score === null)
    return locale === "es"
      ? "La evaluación está incompleta: falta definir la probabilidad o la gravedad del riesgo."
      : "The assessment is incomplete: risk probability or severity has not been specified.";
  const level = {
    incomplete: ["incompleto", "incomplete"],
    low: ["bajo", "low"],
    medium: ["medio", "medium"],
    high: ["alto", "high"],
    very_high: ["muy alto", "very high"],
  }[riskLevel(score)][locale === "es" ? 0 : 1];
  return locale === "es"
    ? `La probabilidad se valora en ${probability} de 5 y la gravedad en ${severity} de 5. El puntaje resultante es ${probability} × ${severity} = ${score}, correspondiente a un nivel de riesgo ${level}.`
    : `Probability is rated ${probability} out of 5 and severity ${severity} out of 5. The resulting score is ${probability} × ${severity} = ${score}, corresponding to a ${level} risk level.`;
}
