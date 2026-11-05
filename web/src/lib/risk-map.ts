import { riskScore, riskLevel, type Payload, type Locale } from "./domain";
export const riskMapLevels = ["low", "medium", "high", "very_high"] as const;
export const riskMapRanges = {
  low: "1–4",
  medium: "5–9",
  high: "10–15",
  very_high: "16–25",
} as const;
export const riskMapNames = {
  es: {
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    very_high: "Muy alto",
    incomplete: "Sin completar",
  },
  en: {
    low: "Low",
    medium: "Medium",
    high: "High",
    very_high: "Very high",
    incomplete: "Incomplete",
  },
} as const;
export const riskMapText = {
  es: {
    initial: "Mapa de riesgos iniciales",
    residual: "Mapa de riesgos residuales",
    before: "Antes de aplicar medidas de mitigación",
    after: "Con las medidas de mitigación previstas",
    intro:
      "Muestra cómo se distribuyen los riesgos de las actividades según su probabilidad de ocurrencia y la gravedad de sus consecuencias.",
    severity: "Gravedad de las consecuencias",
    severityHelp: "¿Qué tan graves serían sus efectos?",
    probability: "Probabilidad de ocurrencia",
    probabilityHelp: "¿Qué tan probable es que suceda?",
    markers:
      "Cada marcador indica cuántas evaluaciones coinciden. Las casillas sin marcador no contienen evaluaciones registradas.",
    scope:
      "Cada evaluación corresponde a un riesgo en una actividad. Este mapa no asigna una categoría global al proyecto.",
    formula:
      "Cálculo: probabilidad × gravedad. Los colores representan la categoría del riesgo.",
    pending: "Por calificar (fuera del mapa)",
    detail: "Detalle de las evaluaciones representadas",
    selected: "Evaluaciones de la casilla seleccionada",
    pendingDetail: "Evaluaciones pendientes de calificación",
    code: "Código",
    activity: "Actividad",
    risk: "Riesgo",
    calculation: "Cálculo",
    category: "Categoría",
    all: "Ver todas las evaluaciones",
    scale: "Escala de 1 a 5",
    range: "Valor",
  },
  en: {
    initial: "Initial risk map",
    residual: "Residual risk map",
    before: "Before mitigation measures",
    after: "With the planned mitigation measures",
    intro:
      "Shows how activity risks are distributed by their likelihood of occurrence and the severity of their consequences.",
    severity: "Severity of consequences",
    severityHelp: "How serious would the effects be?",
    probability: "Probability of occurrence",
    probabilityHelp: "How likely is it to happen?",
    markers:
      "Each marker shows how many assessments share a cell. Cells without a marker contain no recorded assessments.",
    scope:
      "Each assessment represents a risk in one activity. This map does not assign an overall project category.",
    formula:
      "Calculation: probability × severity. Colours represent the risk category.",
    pending: "Awaiting assessment (outside the map)",
    detail: "Details of the assessments shown",
    selected: "Assessments in the selected cell",
    pendingDetail: "Incomplete assessments",
    code: "Code",
    activity: "Activity",
    risk: "Risk",
    calculation: "Calculation",
    category: "Category",
    all: "View all assessments",
    scale: "Scale from 1 to 5",
    range: "Score",
  },
} as const;

export function assessmentCount(count: number, locale: Locale) {
  return `${count} ${locale === "es" ? (count === 1 ? "evaluación" : "evaluaciones") : count === 1 ? "assessment" : "assessments"}`;
}
export const riskMapColors = {
  low: [0.83, 0.94, 0.87],
  medium: [1, 0.94, 0.68],
  high: [1, 0.82, 0.62],
  very_high: [0.98, 0.7, 0.7],
  incomplete: [0.94, 0.94, 0.94],
} as const;
export function riskMapEntries(payload: Payload, residual = false) {
  return payload.activities.flatMap((activity, ai) =>
    activity.risks.map((risk, ri) => {
      const probability = residual
        ? risk.residual_probability
        : risk.probability;
      const severity = residual ? risk.residual_severity : risk.severity;
      const score = riskScore(probability, severity);
      return {
        activity,
        ai,
        risk,
        ri,
        probability,
        severity,
        score,
        level: riskLevel(score),
        code: `${ai + 1}.${ri + 1}`,
      };
    }),
  );
}

export type RiskMapEntry = ReturnType<typeof riskMapEntries>[number];
export function riskMapSummary(entries: RiskMapEntry[], locale: Locale) {
  const complete = entries.filter((e) => e.score !== null);
  const pending = entries.filter((e) => e.score === null);
  const counts = Object.fromEntries(
    riskMapLevels.map((level) => [
      level,
      complete.filter((e) => e.level === level).length,
    ]),
  ) as Record<(typeof riskMapLevels)[number], number>;
  const categories = riskMapLevels.filter((level) => counts[level] > 0);
  const es = locale === "es";
  let text = !entries.length
    ? es
      ? "No hay evaluaciones registradas para esta selección."
      : "No assessments are recorded for this selection."
    : !complete.length
      ? es
        ? "Las evaluaciones registradas están pendientes de calificación; todavía no pueden ubicarse en el mapa."
        : "The recorded assessments are incomplete and cannot yet be placed on the map."
      : `${assessmentCount(complete.length, locale)} ${es ? "con calificación completa" : "with complete ratings"}. ` +
        (categories.length === 1
          ? `${es ? "Categoría del riesgo" : "Risk category"}: ${riskMapNames[locale][categories[0]]}.`
          : `${es ? "Distribución" : "Distribution"}: ${categories.map((level) => `${riskMapNames[locale][level]}: ${counts[level]}`).join("; ")}.`);
  const first = complete[0];
  if (
    first &&
    complete.every(
      (e) =>
        e.probability === first.probability && e.severity === first.severity,
    )
  ) {
    text += ` ${es ? "Probabilidad" : "Probability"} ${first.probability} × ${es ? "gravedad" : "severity"} ${first.severity} = ${first.score}.`;
  }
  return { complete, pending, counts, text };
}
