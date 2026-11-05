export const summarySections = [
  {
    key: "context",
    es: "Contexto",
    en: "Context",
    help: ["Situación y lugar del proyecto.", "Project situation and setting."],
  },
  {
    key: "problem",
    es: "Problema",
    en: "Problem",
    help: ["Problema que busca resolver.", "Problem to address."],
  },
  {
    key: "threats",
    es: "Amenazas",
    en: "Threats",
    help: [
      "Amenazas relacionadas con el problema.",
      "Threats related to the problem.",
    ],
  },
  {
    key: "rationale",
    es: "Justificación",
    en: "Rationale",
    help: ["Por qué es necesario intervenir.", "Why intervention is needed."],
  },
  {
    key: "solution",
    es: "Solución propuesta",
    en: "Proposed solution",
    help: ["Cómo abordará el problema.", "How the problem will be addressed."],
  },
  {
    key: "results",
    es: "Resultados esperados",
    en: "Expected results",
    help: ["Cambios que espera lograr.", "Changes you expect to achieve."],
  },
] as const;
export type SummaryParts = Record<
  (typeof summarySections)[number]["key"],
  string
>;
export const emptySummary: SummaryParts = {
  context: "",
  problem: "",
  threats: "",
  rationale: "",
  solution: "",
  results: "",
};
export function hasSummaryParts(parts: SummaryParts) {
  return Object.values(parts).some((v) => v.trim());
}
export function summaryText(parts: SummaryParts) {
  return summarySections
    .map((s) => parts[s.key].trim())
    .filter(Boolean)
    .join("\n\n");
}

// Older drafts keep their summary in six parts. Read them in the original
// order; the editor stores a single summary when the applicant edits it.
export function projectSummary(concept: {
  summary: string;
  summary_parts?: SummaryParts;
}): string {
  return concept.summary_parts && hasSummaryParts(concept.summary_parts)
    ? summaryText(concept.summary_parts)
    : concept.summary;
}
