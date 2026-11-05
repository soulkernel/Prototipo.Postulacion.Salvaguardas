import { z } from "zod";
export const budgetCategories = [
  ["personnel", "Personal/Salarios", "Personnel/Salaries"],
  ["equipment", "Equipos/Materiales", "Equipment/Materials"],
  ["training", "Formación/Seminarios/Talleres", "Training/Seminars/Workshops"],
  ["consultancy", "Consultorías", "Consultancies"],
  ["services", "Servicios", "Services"],
  ["travel", "Viajes", "Travel"],
  ["administration", "Costos administrativos", "Administrative costs"],
] as const;
export const budgetSchema = z
  .object({
    version: z.literal("glf-annual-v1"),
    currency: z.literal("USD"),
    legacy_summary: z
      .object({
        requested_amount: z.number().nullable(),
        cofinance_amount: z.number().nullable(),
        admin_cost: z.number().nullable(),
      })
      .optional(),
    years: z.number().int().min(1).max(3),
    lines: z
      .array(
        z
          .object({
            id: z.uuid(),
            year: z.number().int().min(1).max(3),
            category: z.enum(
              budgetCategories.map((c) => c[0]) as [string, ...string[]],
            ),
            description: z.string().max(2000),
            glf: z.number().int().min(0).max(99999999999999),
            other: z.number().int().min(0).max(99999999999999),
            remuneration: z.enum(["yes", "no", "pending"]),
          })
          .strict(),
      )
      .max(300),
  })
  .strict()
  .superRefine((b, c) => {
    if (new Set(b.lines.map((l) => l.id)).size !== b.lines.length)
      c.addIssue({ code: "custom", message: "Duplicate budget line" });
    if (b.lines.some((l) => l.year > b.years))
      c.addIssue({
        code: "custom",
        message: "Budget year outside selected horizon",
      });
    for (const source of ["glf", "other"] as const)
      if (b.lines.reduce((s, l) => s + l[source], 0) > 99999999999999)
        c.addIssue({
          code: "custom",
          message: "Budget total exceeds supported monetary range",
        });
  });
export type Budget = z.infer<typeof budgetSchema>;
export function cents(value: string): number | null {
  if (!/^\d{1,12}(\.\d{0,2})?$/.test(value)) return null;
  const [a, b = ""] = value.split(".");
  const n = Number(a) * 100 + Number(b.padEnd(2, "0"));
  return Number.isSafeInteger(n) && n <= 99999999999999 ? n : null;
}
export const usd = (n: number) =>
  `US$ ${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function budgetTotals(b: Budget) {
  const total = (rows: Budget["lines"]) => ({
    glf: rows.reduce((s, l) => s + l.glf, 0),
    other: rows.reduce((s, l) => s + l.other, 0),
  });
  const all = total(b.lines);
  return {
    ...all,
    total: all.glf + all.other,
    admin: total(b.lines.filter((l) => l.category === "administration")),
    remuneration: b.lines
      .filter((l) => l.remuneration === "yes")
      .reduce((s, l) => s + l.glf + l.other, 0),
    unclassified: b.lines.filter(
      (l) => l.remuneration === "pending" && l.glf + l.other > 0,
    ).length,
    categories: budgetCategories.map((c) => ({
      id: c[0],
      ...total(b.lines.filter((l) => l.category === c[0])),
    })),
    years: Array.from({ length: b.years }, (_, i) => ({
      year: i + 1,
      ...total(b.lines.filter((l) => l.year === i + 1)),
    })),
  };
}
export function remunerationCheck(b: Budget) {
  const t = budgetTotals(b);
  return {
    amount: t.remuneration,
    base: t.glf,
    exceeds: t.remuneration * 10 > t.glf * 3,
    unclassified: t.unclassified,
    definitive: t.unclassified === 0,
  };
}
export function adminCheck(b: Budget, base: "glf" | "project" | null) {
  const t = budgetTotals(b);
  return base === null
    ? null
    : {
        amount: t.admin.glf + t.admin.other,
        base: base === "glf" ? t.glf : t.total,
        exceeds:
          (t.admin.glf + t.admin.other) * 10 >
          (base === "glf" ? t.glf : t.total),
      };
}
export function budgetText(b: Budget, locale: "es" | "en") {
  const t = budgetTotals(b);
  return [
    locale === "es"
      ? "Presupuesto anual en dólares estadounidenses (USD)"
      : "Annual budget in US dollars (USD)",
    ...t.years.map(
      (y) =>
        `${locale === "es" ? "Año" : "Year"} ${y.year}: GLF ${usd(y.glf)}; ${locale === "es" ? "Otros" : "Other"} ${usd(y.other)}; Total ${usd(y.glf + y.other)}`,
    ),
    ...t.categories.map(
      (c, i) =>
        `${budgetCategories[i][locale === "es" ? 1 : 2]}: GLF ${usd(c.glf)}; ${locale === "es" ? "Otros" : "Other"} ${usd(c.other)}`,
    ),
    `Total GLF: ${usd(t.glf)}; ${locale === "es" ? "Otros" : "Other"}: ${usd(t.other)}; Total: ${usd(t.total)}`,
    ...b.lines.map(
      (l) =>
        `${locale === "es" ? "Año" : "Year"} ${l.year} · ${budgetCategories.find((c) => c[0] === l.category)?.[locale === "es" ? 1 : 2]} · ${l.description}: GLF ${usd(l.glf)}; ${locale === "es" ? "Otros" : "Other"} ${usd(l.other)}`,
    ),
  ].join("\n");
}

export function budgetYears(start: string, end: string) {
  const a = new Date(start + "T12:00:00Z"),
    b = new Date(end + "T12:00:00Z");
  if (!Number.isFinite(+a) || !Number.isFinite(+b)) return 1;
  for (let n = 1; n <= 3; n++) {
    const year = a.getUTCFullYear() + n,
      month = a.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const limit = new Date(
      Date.UTC(year, month, Math.min(a.getUTCDate(), lastDay), 12),
    );
    limit.setUTCDate(limit.getUTCDate() - 1);
    if (b <= limit) return n;
  }
  return 3;
}

export function budgetIssues(
  b: Budget | undefined,
  c: {
    requested_amount: number | null;
    cofinance_amount: number | null;
    admin_cost: number | null;
    start_date: string;
    end_date: string;
  },
) {
  if (!b?.lines.length) return [];
  const t = budgetTotals(b);
  const problems: string[] = [];
  if (b.years > budgetYears(c.start_date, c.end_date))
    problems.push("budget_year");
  if (b.lines.some((l) => !l.description.trim()))
    problems.push("budget_description");
  if (
    t.glf !== Math.round((c.requested_amount ?? 0) * 100) ||
    t.other !== Math.round((c.cofinance_amount ?? 0) * 100) ||
    t.admin.glf + t.admin.other !== Math.round((c.admin_cost ?? 0) * 100)
  )
    problems.push("budget_totals");
  return problems;
}
