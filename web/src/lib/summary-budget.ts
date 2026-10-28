import { z } from "zod";
import type { Locale } from "./domain";

export const summaryBudgetCategories = [
  ["goods", "Bienes", "Goods"],
  ["services", "Servicios", "Services"],
  ["consultancies", "Consultorías", "Consultancies"],
  ["fees", "Honorarios", "Fees"],
] as const;
export type SummaryBudgetCategory = (typeof summaryBudgetCategories)[number][0];
const cents = z.number().int().min(0).max(99999999999999).nullable();
export const summaryBudgetSchema = z
  .object({
    version: z.literal("glf-summary-v1"),
    currency: z.literal("USD"),
    entries: z
      .array(
        z
          .object({
            activity_id: z.uuid(),
            goods: cents,
            services: cents,
            consultancies: cents,
            fees: cents,
          })
          .strict(),
      )
      .max(100),
    administrative: cents,
    other_remuneration: cents,
    sgas: cents,
  })
  .strict()
  .superRefine((b, ctx) => {
    if (
      new Set(b.entries.map((entry) => entry.activity_id.toLowerCase()))
        .size !== b.entries.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Duplicate summary budget activity",
      });
    const total = b.entries.reduce(
      (sum, entry) =>
        sum +
        summaryBudgetCategories.reduce((s, [key]) => s + (entry[key] ?? 0), 0),
      0,
    );
    if (!Number.isSafeInteger(total) || total > 199999999999998)
      ctx.addIssue({
        code: "custom",
        message: "Summary budget exceeds supported monetary range",
      });
  });
export type SummaryBudget = z.infer<typeof summaryBudgetSchema>;
export type SummaryBudgetEntry = SummaryBudget["entries"][number];
export type SummaryBudgetContext = {
  concept: {
    requested_amount: number | null;
    cofinance_amount: number | null;
    summary_budget?: SummaryBudget;
  };
  activities: { id: string; title: string; objective_ids?: string[] }[];
};
export function emptySummaryBudget(): SummaryBudget {
  return {
    version: "glf-summary-v1",
    currency: "USD",
    entries: [],
    administrative: null,
    other_remuneration: 0,
    sgas: null,
  };
}
export function emptySummaryBudgetEntry(
  activity_id: string,
): SummaryBudgetEntry {
  return {
    activity_id,
    goods: null,
    services: null,
    consultancies: null,
    fees: null,
  };
}
export function summaryEntryTotal(entry: SummaryBudgetEntry) {
  return summaryBudgetCategories.reduce(
    (sum, [key]) => sum + (entry[key] ?? 0),
    0,
  );
}
export function summaryBudgetTotals(b: SummaryBudget | undefined) {
  const categories = Object.fromEntries(
    summaryBudgetCategories.map(([key]) => [
      key,
      b?.entries.reduce((sum, entry) => sum + (entry[key] ?? 0), 0) ?? 0,
    ]),
  ) as Record<SummaryBudgetCategory, number>;
  return {
    categories,
    total: Object.values(categories).reduce((sum, n) => sum + n, 0),
    remuneration: categories.fees + (b?.other_remuneration ?? 0),
  };
}
export function summaryBudgetIssues(p: SummaryBudgetContext): string[] {
  const b = p.concept.summary_budget;
  if (!b) return ["summary_budget"];
  const issues: string[] = [];
  const t = summaryBudgetTotals(b);
  if (!p.activities.length) issues.push("summary_budget_activities");
  for (const activity of p.activities) {
    const entry = b.entries.find((row) => row.activity_id === activity.id);
    if (!entry || summaryBudgetCategories.some(([key]) => entry[key] === null))
      issues.push("summary_budget_activity_" + activity.id);
  }
  if (
    b.entries.some(
      (entry) =>
        !p.activities.some((activity) => activity.id === entry.activity_id),
    )
  )
    issues.push("summary_budget_unlinked");
  for (const key of ["administrative", "other_remuneration", "sgas"] as const)
    if (b[key] === null) issues.push("summary_budget_" + key);
  const expected =
    Math.round((p.concept.requested_amount ?? 0) * 100) +
    Math.round((p.concept.cofinance_amount ?? 0) * 100);
  if (
    p.concept.requested_amount === null ||
    p.concept.cofinance_amount === null
  )
    issues.push("summary_budget_reference");
  else if (t.total !== expected) issues.push("summary_budget_totals");
  if ((b.administrative ?? 0) * 10 > expected)
    issues.push("summary_budget_admin_limit");
  if (
    t.remuneration * 10 >
    Math.round((p.concept.requested_amount ?? 0) * 100) * 3
  )
    issues.push("summary_budget_remuneration_limit");
  if ((b.other_remuneration ?? 0) > t.total - t.categories.fees)
    issues.push("summary_budget_remuneration_subset");
  if ((b.sgas ?? 0) > t.total) issues.push("summary_budget_sgas_subset");
  return issues;
}
export function summaryBudgetMessage(code: string, locale: Locale) {
  const es = locale === "es";
  const messages: Record<string, [string, string]> = {
    summary_budget: [
      "Complete el presupuesto resumido de las actividades.",
      "Complete the activity summary budget.",
    ],
    summary_budget_activities: [
      "Agregue las actividades en Descripción del proyecto.",
      "Add activities under Project description.",
    ],
    summary_budget_unlinked: [
      "Hay importes de actividades eliminadas: revíselos antes de continuar.",
      "Amounts remain for deleted activities: review them before continuing.",
    ],
    summary_budget_reference: [
      "Complete el monto GLF y el cofinanciamiento en Información general.",
      "Complete GLF funding and cofinancing in General information.",
    ],
    summary_budget_totals: [
      "El presupuesto debe coincidir con el monto GLF más el cofinanciamiento de Información general.",
      "The budget must match GLF funding plus cofinancing in General information.",
    ],
    summary_budget_admin_limit: [
      "Los gastos administrativos incluidos superan el 10 % del costo total del proyecto.",
      "Included administrative costs exceed 10% of the total project cost.",
    ],
    summary_budget_remuneration_limit: [
      "Las remuneraciones, honorarios y salarios incluidos superan el 30 % del monto solicitado al GLF.",
      "Included remuneration, fees and salaries exceed 30% of the amount requested from GLF.",
    ],
    summary_budget_remuneration_subset: [
      "Las otras remuneraciones deben estar incluidas en los rubros distintos de Honorarios.",
      "Other remuneration must be included in categories other than Fees.",
    ],
    summary_budget_sgas_subset: [
      "El importe del SGAS debe estar incluido en el presupuesto; no puede superar su total.",
      "The ESMS amount must be included in the budget and cannot exceed its total.",
    ],
  };
  return (
    messages[code]?.[es ? 0 : 1] ??
    (es
      ? "Complete los cuatro rubros y los importes incluidos; use 0 cuando corresponda."
      : "Complete the four categories and included amounts; use 0 where applicable.")
  );
}
export function summaryUsd(cents: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "es" ? "es-EC" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
