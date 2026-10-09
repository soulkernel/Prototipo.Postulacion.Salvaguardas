import type { Call, Locale } from "./domain";
export type CallEditorState = {
  call: Call | null;
  values?: Record<string, string | string[]>;
  error?: string;
  saved: boolean;
  sequence: number;
};
export function callIssues(c: Call, locale: Locale, now: number): string[] {
  const es = locale === "es";
  const issues: string[] = [];
  const labels: Record<string, string> = es
    ? {
        code: "Código",
        title_es: "Título en español",
        title_en: "Título en inglés",
        description_es: "Descripción en español",
        description_en: "Descripción en inglés",
        rules_version: "Versión de bases",
      }
    : {
        code: "Code",
        title_es: "Spanish title",
        title_en: "English title",
        description_es: "Spanish description",
        description_en: "English description",
        rules_version: "Rules version",
      };
  for (const [key, label] of Object.entries(labels))
    if (!String(c[key as keyof Call] ?? "").trim())
      issues.push(
        `${label}: ${es ? "complete este campo" : "complete this field"}.`,
      );
  if (
    !c.opens_at ||
    !c.closes_at ||
    !Number.isFinite(Date.parse(c.opens_at)) ||
    !Number.isFinite(Date.parse(c.closes_at)) ||
    Date.parse(c.closes_at) <= Date.parse(c.opens_at) ||
    Date.parse(c.closes_at) <= now
  )
    issues.push(
      es
        ? "Fechas: indique apertura y cierre válidos; el cierre debe ser posterior a la apertura y al momento actual."
        : "Dates: provide valid opening and closing dates; closing must be after opening and the current time.",
    );
  if (!c.rules.categories.length)
    issues.push(
      es ? "Habilite al menos una categoría." : "Enable at least one category.",
    );
  for (const cat of c.rules.categories)
    if (
      !cat.label_es.trim() ||
      !cat.label_en.trim() ||
      !Number.isFinite(cat.min_amount) ||
      cat.min_amount < 0 ||
      (cat.max_amount !== null &&
        (!Number.isFinite(cat.max_amount) ||
          cat.max_amount < cat.min_amount)) ||
      !Number.isInteger(cat.max_months) ||
      cat.max_months < 1 ||
      cat.max_months > 36 ||
      !Number.isFinite(cat.cofinance_percent) ||
      cat.cofinance_percent < 0 ||
      cat.cofinance_percent > 100
    )
      issues.push(
        `${es ? "Revise nombres, montos, plazo y cofinanciamiento de la categoría" : "Review category names, amounts, term and cofinancing"}: ${cat.label_es || cat.id}.`,
      );
  if (
    !c.rules.applicant_types.length ||
    c.rules.applicant_types.some(
      (t) => !["individual", "organization"].includes(t),
    )
  )
    issues.push(
      es
        ? "Seleccione los tipos de solicitante admitidos."
        : "Select eligible applicant types.",
    );
  if (!c.rules.privacy_es.trim() || !c.rules.privacy_en.trim())
    issues.push(
      es
        ? "Complete el aviso de privacidad en ambos idiomas."
        : "Complete the privacy notice in both languages.",
    );
  if (
    !Number.isInteger(c.rules.summary_word_limit) ||
    c.rules.summary_word_limit < 1 ||
    c.rules.summary_word_limit > 5000 ||
    !Number.isFinite(c.rules.max_admin_percent) ||
    c.rules.max_admin_percent < 0 ||
    c.rules.max_admin_percent > 100
  )
    issues.push(
      es
        ? "Revise el límite de palabras y el porcentaje administrativo."
        : "Review the word limit and administrative percentage.",
    );
  if (c.phase2_schema.some((f) => !f.label_es.trim() || !f.label_en.trim()))
    issues.push(
      es
        ? "Complete los apartados de Fase 2 en ambos idiomas."
        : "Complete Phase 2 sections in both languages.",
    );
  return issues;
}
export function callFormValues(c: Call): Record<string, string | string[]> {
  const v: Record<string, string | string[]> = {};
  for (const k of [
    "code",
    "title_es",
    "title_en",
    "description_es",
    "description_en",
    "rules_version",
  ] as const)
    v[k] = c[k];
  for (const k of ["opens_at", "closes_at"] as const)
    v[k] = c[k]
      ? new Date(Date.parse(c[k]!) - 6 * 3600000).toISOString().slice(0, 16)
      : "";
  v.applicant_types = c.rules.applicant_types;
  v.word_limit = String(c.rules.summary_word_limit);
  v.admin_percent = String(c.rules.max_admin_percent);
  v.attachments = c.rules.required_attachments.join("\n");
  v.privacy_es = c.rules.privacy_es;
  v.privacy_en = c.rules.privacy_en;
  v.phase2_es = c.phase2_schema.map((f) => f.label_es).join("\n");
  v.phase2_en = c.phase2_schema.map((f) => f.label_en).join("\n");
  for (const cat of c.rules.categories) {
    v[cat.id + "_enabled"] = "on";
    for (const [field, key] of Object.entries({
      es: "label_es",
      en: "label_en",
      min: "min_amount",
      max: "max_amount",
      months: "max_months",
      cofinance: "cofinance_percent",
    }))
      v[cat.id + "_" + field] = String(cat[key as keyof typeof cat] ?? "");
  }
  return v;
}
