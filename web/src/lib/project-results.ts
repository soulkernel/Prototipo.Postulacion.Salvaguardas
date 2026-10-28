import { z } from "zod";

export const resultUnits = [
  ["people", "Personas", "People"],
  ["activities", "Actividades", "Activities"],
  ["products", "Productos", "Products"],
  ["sites", "Sitios", "Sites"],
  ["hectares", "Hectáreas", "Hectares"],
  ["percent", "Porcentaje", "Percentage"],
  ["other", "Otra unidad", "Other unit"],
] as const;
export const projectResultSchema = z
  .object({
    id: z.uuid(),
    objective_id: z.string().max(36),
    result: z.string().max(2000),
    indicator: z.string().max(1000),
    target: z.number().finite().min(0).max(999999999999).nullable(),
    unit: z.enum(["", ...resultUnits.map((u) => u[0])]),
    other_unit: z.string().max(100),
    evidence: z.string().max(1000),
  })
  .strict();
export type ProjectResult = z.infer<typeof projectResultSchema>;
type ResultConcept = {
  results: string;
  project_results?: ProjectResult[];
  strategic_alignment?: {
    objectives: { id: string; kind: string; text: string }[];
  };
};
export function newProjectResult(): ProjectResult {
  return {
    id: crypto.randomUUID(),
    objective_id: "",
    result: "",
    indicator: "",
    target: null,
    unit: "",
    other_unit: "",
    evidence: "",
  };
}
// Stage comes from the application, never from a field supplied by the applicant.
// Keep full-proposal checks for callers that do not explicitly select a stage.
export function resultIssues(c: ResultConcept, stage = 2): string[] {
  if (c.project_results === undefined) return [];
  if (!c.project_results.length) return ["results"];
  const ids = new Set<string>();
  return c.project_results.flatMap((r, i) => {
    const valid =
      !ids.has(r.id) &&
      !!r.result.trim() &&
      !!c.strategic_alignment?.objectives.some(
        (o) =>
          o.id === r.objective_id && o.kind === "specific" && o.text.trim(),
      ) &&
      (stage === 1 ||
        (!!r.indicator.trim() &&
          r.target !== null &&
          !!r.unit &&
          (r.unit !== "other" || !!r.other_unit.trim()) &&
          !!r.evidence.trim() &&
          (r.unit !== "percent" || r.target <= 100)));
    ids.add(r.id);
    return valid ? [] : [`result_${i + 1}`];
  });
}
export function resultText(
  c: ResultConcept,
  locale: "es" | "en" = "es",
  stage = 2,
): string {
  if (c.project_results === undefined) return c.results;
  const es = locale === "es";
  const objectives =
    c.strategic_alignment?.objectives.filter((o) => o.kind === "specific") ||
    [];
  return c.project_results
    .map((r, i) => {
      const index = objectives.findIndex((o) => o.id === r.objective_id);
      const unit =
        r.unit === "other"
          ? r.other_unit
          : resultUnits.find((u) => u[0] === r.unit)?.[es ? 1 : 2] || "—";
      const outcome = `${es ? "Objetivo específico" : "Specific objective"}: ${index < 0 ? "—" : `OE${index + 1}: ${objectives[index].text}`}\n${es ? "Resultado" : "Result"} ${i + 1}: ${r.result}`;
      return stage === 1
        ? outcome
        : `${outcome}\n${es ? "Indicador de impacto" : "Impact indicator"}: ${r.indicator}\n${es ? "Meta propuesta" : "Proposed target"}: ${r.target ?? "—"} ${unit}\n${es ? "Evidencia prevista" : "Expected evidence"}: ${r.evidence}`;
    })
    .join("\n\n");
}
