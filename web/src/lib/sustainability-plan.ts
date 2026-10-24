import { z } from "zod";
import type { Concept, Locale } from "./domain";
import {
  monitoringReference,
  monitoringEntryIssues,
  type MonitoringContext,
} from "./monitoring-plan";

export const sustainabilityReferenceSchema = z
  .object({
    type: z.enum(["activity", "result"]),
    id: z.uuid(),
  })
  .strict();
export const sustainabilityItemSchema = z
  .object({
    id: z.uuid(),
    references: z
      .array(sustainabilityReferenceSchema)
      .max(130)
      .refine(
        (rows) =>
          new Set(rows.map((r) => `${r.type}:${r.id.toLowerCase()}`)).size ===
          rows.length,
      ),
    strategy: z.string().max(12000),
    actor_type: z.enum(["", "applicant", "partner", "other", "undecided"]),
    actor_id: z.union([z.literal(""), z.uuid()]),
    actor_name: z.string().max(200),
    replication: z.enum([
      "",
      "scale_up",
      "replicate",
      "both",
      "none",
      "undecided",
    ]),
    replication_details: z.string().max(12000),
    monitoring_id: z.union([z.literal(""), z.uuid()]),
  })
  .strict()
  .refine(
    (item) =>
      (item.actor_type === "partner" || !item.actor_id) &&
      (item.actor_type === "other" || !item.actor_name),
  );
export const sustainabilityPlanSchema = z
  .array(sustainabilityItemSchema)
  .max(30)
  .refine(
    (rows) => new Set(rows.map((r) => r.id.toLowerCase())).size === rows.length,
  );
export type SustainabilityItem = z.infer<typeof sustainabilityItemSchema>;
export type SustainabilityReference = z.infer<
  typeof sustainabilityReferenceSchema
>;
export type SustainabilityContext = MonitoringContext & {
  concept: MonitoringContext["concept"] &
    Pick<
      Concept,
      | "sustainability"
      | "sustainability_plan"
      | "partner_organizations"
      | "applicant_name"
    >;
};
export function newSustainabilityItem(): SustainabilityItem {
  return {
    id: crypto.randomUUID(),
    references: [],
    strategy: "",
    actor_type: "",
    actor_id: "",
    actor_name: "",
    replication: "",
    replication_details: "",
    monitoring_id: "",
  };
}
export const replicationOptions = [
  ["scale_up", "Ampliación", "Scaling up"],
  ["replicate", "Réplica", "Replication"],
  ["both", "Ampliación y réplica", "Scaling up and replication"],
  ["none", "No prevista", "Not planned"],
  [
    "undecided",
    "Por definir en el proyecto completo",
    "To be defined in the full proposal",
  ],
] as const;
export function replicationLabel(
  value: SustainabilityItem["replication"],
  locale: Locale,
) {
  return (
    replicationOptions.find((o) => o[0] === value)?.[locale === "es" ? 1 : 2] ||
    "—"
  );
}
export function sustainabilityReference(
  p: SustainabilityContext,
  ref: SustainabilityReference,
  locale: Locale,
) {
  return monitoringReference(
    p,
    {
      id: ref.id,
      parameter: ref.type,
      reference_id: ref.id,
      indicator: "",
      strategy: "",
    },
    locale,
  );
}
export function sustainabilityActor(
  p: SustainabilityContext,
  item: SustainabilityItem,
  locale: Locale,
) {
  const es = locale === "es";
  if (item.actor_type === "applicant")
    return p.concept.applicant_name || (es ? "Proponente" : "Applicant");
  if (item.actor_type === "partner")
    return (
      p.concept.partner_organizations?.find((r) => r.id === item.actor_id)
        ?.name ||
      (es
        ? "Organización asociada pendiente de revisar"
        : "Partner organization awaiting review")
    );
  if (item.actor_type === "other")
    return (
      item.actor_name ||
      (es
        ? "Otro actor pendiente de identificar"
        : "Other actor awaiting identification")
    );
  if (item.actor_type === "undecided")
    return es
      ? "Por definir en el proyecto completo"
      : "To be defined in the full proposal";
  return "—";
}
export function sustainabilityIndicator(
  p: SustainabilityContext,
  item: SustainabilityItem,
  locale: Locale,
) {
  const es = locale === "es",
    index =
      p.concept.monitoring_plan?.findIndex(
        (m) => m.id === item.monitoring_id,
      ) ?? -1;
  const row = p.concept.monitoring_plan?.[index];
  return row
    ? `${es ? "Indicador" : "Indicator"} ${index + 1}: ${row.indicator || "—"} · ${monitoringReference(p, row, locale).label}`
    : es
      ? "Indicador pendiente de revisar"
      : "Indicator awaiting review";
}
export const sustainabilityFieldNames = {
  references: [
    "resultados o actividades asociados",
    "associated outcomes or activities",
  ],
  strategy: [
    "estrategia de sostenibilidad y apropiación",
    "sustainability and ownership strategy",
  ],
  actor_type: [
    "actor previsto para dar continuidad",
    "actor expected to ensure continuity",
  ],
  actor_id: [
    "organización asociada prevista para dar continuidad",
    "partner expected to ensure continuity",
  ],
  actor_name: ["nombre del otro actor", "other actor name"],
  replication: [
    "posibilidad de ampliación o réplica",
    "potential for scaling up or replication",
  ],
  replication_details: [
    "condiciones o motivo de la respuesta sobre ampliación o réplica",
    "conditions or reason for the scaling up or replication response",
  ],
  monitoring_id: [
    "indicador de seguimiento válido, o retire el vínculo opcional",
    "valid monitoring indicator, or remove the optional link",
  ],
} as const;
export type SustainabilityField = keyof typeof sustainabilityFieldNames;
export function sustainabilityEntryIssues(
  p: SustainabilityContext,
  item: SustainabilityItem,
): SustainabilityField[] {
  const issues: SustainabilityField[] = [];
  if (
    !item.references.length ||
    item.references.some((ref) => !sustainabilityReference(p, ref, "es").valid)
  )
    issues.push("references");
  if (!item.strategy.trim()) issues.push("strategy");
  if (!item.actor_type) issues.push("actor_type");
  if (
    item.actor_type === "partner" &&
    !p.concept.partner_organizations?.some(
      (r) => r.id === item.actor_id && r.name.trim(),
    )
  )
    issues.push("actor_id");
  if (item.actor_type === "other" && !item.actor_name.trim())
    issues.push("actor_name");
  if (!item.replication) issues.push("replication");
  if (!item.replication_details.trim()) issues.push("replication_details");
  if (item.monitoring_id) {
    const indicator = p.concept.monitoring_plan?.find(
      (m) => m.id === item.monitoring_id,
    );
    if (!indicator || monitoringEntryIssues(p, indicator).length)
      issues.push("monitoring_id");
  }
  return issues;
}
export function sustainabilityIssues(p: SustainabilityContext): string[] {
  const plan = p.concept.sustainability_plan;
  if (plan === undefined)
    return p.concept.sustainability.trim() ? [] : ["sustainability"];
  if (!plan.length) return ["sustainability"];
  return plan.flatMap((item, i) =>
    sustainabilityEntryIssues(p, item).length
      ? [`sustainability_${i + 1}`]
      : [],
  );
}
export function linkedSustainabilityCount(
  p: Pick<SustainabilityContext, "concept">,
  type: "activity" | "result" | "partner" | "monitoring",
  id: string,
) {
  return (
    p.concept.sustainability_plan?.filter((item) =>
      type === "partner"
        ? item.actor_type === "partner" && item.actor_id === id
        : type === "monitoring"
          ? item.monitoring_id === id
          : item.references.some((r) => r.type === type && r.id === id),
    ).length || 0
  );
}
export function sustainabilityObjectiveIds(p: SustainabilityContext) {
  return [
    ...new Set(
      (p.concept.sustainability_plan || [])
        .flatMap((item) =>
          item.references.flatMap((ref) =>
            ref.type === "activity"
              ? p.activities.find((a) => a.id === ref.id)?.objective_ids || []
              : [
                  p.concept.project_results?.find((r) => r.id === ref.id)
                    ?.objective_id || "",
                ],
          ),
        )
        .filter(Boolean),
    ),
  ];
}
