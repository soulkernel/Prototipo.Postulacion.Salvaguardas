import { z } from "zod";
import type { Activity, Concept, Locale, Payload } from "./domain";

export const monitoringItemSchema = z
  .object({
    id: z.uuid(),
    parameter: z.enum(["", "activity", "result"]),
    reference_id: z.union([z.literal(""), z.uuid()]),
    indicator: z.string().max(1000),
    strategy: z.string().max(2000),
  })
  .strict();
export const monitoringPlanSchema = z
  .array(monitoringItemSchema)
  .max(30)
  .refine(
    (rows) => new Set(rows.map((r) => r.id.toLowerCase())).size === rows.length,
  );
export type MonitoringItem = z.infer<typeof monitoringItemSchema>;
export type MonitoringContext = {
  concept: Pick<
    Concept,
    "monitoring" | "monitoring_plan" | "project_results" | "strategic_alignment"
  >;
  activities: Pick<Activity, "id" | "title" | "objective_ids">[];
};
export function newMonitoringItem(): MonitoringItem {
  return {
    id: crypto.randomUUID(),
    parameter: "",
    reference_id: "",
    indicator: "",
    strategy: "",
  };
}
export function monitoringParameter(
  parameter: MonitoringItem["parameter"],
  locale: Locale,
) {
  return parameter === "activity"
    ? locale === "es"
      ? "Avance de una actividad"
      : "Progress of an activity"
    : parameter === "result"
      ? locale === "es"
        ? "Logro de un resultado"
        : "Achievement of an outcome"
      : "—";
}
export function monitoringReference(
  p: MonitoringContext,
  item: MonitoringItem,
  locale: Locale,
) {
  const es = locale === "es";
  const specific =
    p.concept.strategic_alignment?.objectives.filter(
      (o) => o.kind === "specific",
    ) || [];
  const source =
    item.parameter === "activity"
      ? p.activities
      : item.parameter === "result"
        ? p.concept.project_results || []
        : [];
  const index = source.findIndex((r) => r.id === item.reference_id);
  if (index < 0)
    return {
      label: es
        ? "Registro pendiente de seleccionar"
        : "Record awaiting selection",
      objectives: [] as string[],
      valid: false,
      missing: true,
    };
  const row = source[index];
  const text = "title" in row ? row.title : row.result;
  const ids = "title" in row ? row.objective_ids || [] : [row.objective_id];
  const objectives = ids.map((id) =>
    specific.find((o) => o.id === id && o.text.trim()),
  );
  return {
    label: `${item.parameter === "activity" ? (es ? "Actividad" : "Activity") : es ? "Resultado" : "Result"} ${index + 1}: ${text}`,
    objectives: objectives.filter((o) => !!o).map((o) => o!.text),
    valid: !!text.trim() && !!ids.length && objectives.every((o) => !!o),
    missing: false,
  };
}
export type MonitoringField =
  "parameter" | "reference_id" | "indicator" | "strategy";
export function monitoringEntryIssues(
  p: MonitoringContext,
  item: MonitoringItem,
): MonitoringField[] {
  const issues: MonitoringField[] = [];
  if (!item.parameter) issues.push("parameter");
  if (!monitoringReference(p, item, "es").valid) issues.push("reference_id");
  if (!item.indicator.trim()) issues.push("indicator");
  if (!item.strategy.trim()) issues.push("strategy");
  return issues;
}
export function monitoringIssues(p: MonitoringContext): string[] {
  const plan = p.concept.monitoring_plan;
  // Current editable forms require explicit links. Legacy text is still retained
  // and rendered by frozen documents, but does not complete a new submission.
  if (!plan?.length) return ["monitoring"];
  const seen = new Set<string>();
  return plan.flatMap((item, i) => {
    const invalid =
      seen.has(item.id.toLowerCase()) ||
      monitoringEntryIssues(p, item).length > 0;
    seen.add(item.id.toLowerCase());
    return invalid ? [`monitoring_${i + 1}`] : [];
  });
}
// Presentation is derived from linked records; the stored legacy narrative is
// retained verbatim and never overwritten by generated text or inferred cards.
export function monitoringText(p: MonitoringContext, locale: Locale = "es") {
  if (p.concept.monitoring_plan === undefined) return p.concept.monitoring;
  const es = locale === "es";
  return p.concept.monitoring_plan
    .map((item, i) => {
      const ref = monitoringReference(p, item, locale);
      return `${es ? "Indicador" : "Indicator"} ${i + 1}: ${item.indicator}\n${es ? "Parámetro de evaluación que propone" : "Proposed evaluation parameter"}: ${monitoringParameter(item.parameter, locale)}\n${ref.label}\n${es ? "Objetivos específicos asociados" : "Associated specific objectives"}: ${ref.objectives.join("; ") || "—"}\n${es ? "Estrategia y actividades de seguimiento" : "Monitoring strategy and activities"}: ${item.strategy}`;
    })
    .join("\n\n");
}
export function linkedMonitoringCount(
  p: Pick<Payload, "concept">,
  parameter: "activity" | "result",
  id: string,
) {
  return (
    p.concept.monitoring_plan?.filter(
      (item) => item.parameter === parameter && item.reference_id === id,
    ).length || 0
  );
}
export function monitoredObjectiveIds(p: MonitoringContext) {
  return [
    ...new Set(
      (p.concept.monitoring_plan || [])
        .flatMap((item) =>
          item.parameter === "activity"
            ? p.activities.find((a) => a.id === item.reference_id)
                ?.objective_ids || []
            : item.parameter === "result"
              ? [
                  p.concept.project_results?.find(
                    (r) => r.id === item.reference_id,
                  )?.objective_id || "",
                ]
              : [],
        )
        .filter(Boolean),
    ),
  ];
}
