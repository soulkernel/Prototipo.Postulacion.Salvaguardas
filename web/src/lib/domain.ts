import { z } from "zod";
import { normalizePhone } from "./phone";
export const roles = [
  "applicant",
  "grants_manager",
  "sustainability_reviewer",
  "project_coordinator",
  "committee_member",
  "administrator",
] as const;
export type Role = (typeof roles)[number];
export type Locale = "es" | "en";
const text = z.string().max(12000);
const money = z.number().finite().min(0).max(999999999999.99).nullable();
const scale = z.number().int().min(1).max(5).nullable();
export const conceptSchema = z
  .object({
    title: text,
    applicant_type: text,
    applicant_name: text,
    contact_name: text,
    email: text,
    phone: z.string().max(32),
    address: text,
    partners: text,
    location: text,
    project_type: text,
    category_id: text,
    requested_amount: money,
    cofinance_amount: money,
    admin_cost: money,
    start_date: z.string().max(10),
    end_date: z.string().max(10),
    summary: text,
    objectives: text,
    beneficiaries: text,
    results: text,
    sustainability: text,
    alignment: text,
    monitoring: text,
    environmental_risks: text,
    social_risks: text,
  })
  .strict();
export const riskSchema = z
  .object({
    id: z.uuid(),
    name: text,
    description: text,
    dimension: z.enum(["environmental", "social"]),
    probability: scale,
    severity: scale,
    residual_probability: scale,
    residual_severity: scale,
    location: text,
    cost: money,
    responsible: text,
    start_quarter: z.number().int().min(1).max(12).nullable(),
    end_quarter: z.number().int().min(1).max(12).nullable(),
    measures: z
      .array(
        z
          .object({
            catalog_id: z.uuid().optional(),
            text: text.optional(),
            label_es: text.optional(),
            label_en: text.optional(),
            normative_reference: text.optional(),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();
export const activitySchema = z
  .object({
    id: z.uuid(),
    title: text,
    description: text,
    no_risks_reason: text,
    risks: z.array(riskSchema).max(100),
  })
  .strict();
export const payloadSchema = z
  .object({
    concept: conceptSchema,
    activities: z.array(activitySchema).max(100),
    phase2: z.record(z.string(), z.string().max(12000)),
    consent: z.boolean(),
    truthful: z.boolean(),
  })
  .strict();
export type Payload = z.infer<typeof payloadSchema>;
export type Risk = z.infer<typeof riskSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type Category = {
  id: string;
  label_es: string;
  label_en: string;
  min_amount: number;
  max_amount: number | null;
  max_months: number;
  cofinance_percent: number;
};
export type Rules = {
  categories: Category[];
  applicant_types: string[];
  summary_word_limit: number;
  max_admin_percent: number;
  required_attachments: string[];
  privacy_es: string;
  privacy_en: string;
  version?: string;
};
export type Call = {
  id: string;
  code: string;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  opens_at: string;
  closes_at: string;
  status: string;
  rules_version: string;
  rules: Rules;
  phase2_schema: {
    id: string;
    label_es: string;
    label_en: string;
    type: string;
    required: boolean;
  }[];
};
export type Application = {
  id: string;
  reference_code: string;
  call_id: string;
  applicant_id: string;
  status: string;
  stage: number;
  revision: number;
  payload: Payload;
  rules_snapshot: Rules;
  correction_deadline: string | null;
  phase2_deadline: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};
export function emptyPayload(): Payload {
  return {
    concept: {
      title: "",
      applicant_type: "",
      applicant_name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      partners: "",
      location: "",
      project_type: "",
      category_id: "",
      requested_amount: null,
      cofinance_amount: null,
      admin_cost: null,
      start_date: "",
      end_date: "",
      summary: "",
      objectives: "",
      beneficiaries: "",
      results: "",
      sustainability: "",
      alignment: "",
      monitoring: "",
      environmental_risks: "",
      social_risks: "",
    },
    activities: [],
    phase2: {},
    consent: false,
    truthful: false,
  };
}
export function newRisk(): Risk {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    dimension: "environmental",
    probability: null,
    severity: null,
    residual_probability: null,
    residual_severity: null,
    location: "",
    cost: null,
    responsible: "",
    start_quarter: null,
    end_quarter: null,
    measures: [],
  };
}
export function newActivity(): Activity {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    no_risks_reason: "",
    risks: [],
  };
}
export function riskScore(p: number | null, s: number | null) {
  return p === null || s === null ? null : p * s;
}
export function riskLevel(
  score: number | null,
): "incomplete" | "low" | "medium" | "high" | "very_high" {
  return score === null
    ? "incomplete"
    : score <= 4
      ? "low"
      : score <= 9
        ? "medium"
        : score <= 15
          ? "high"
          : "very_high";
}
export function safeReturnPath(value: unknown, fallback = "/applicant") {
  if (
    typeof value !== "string" ||
    value.includes("\\") ||
    /[\u0000-\u0020]/.test(value)
  )
    return fallback;
  try {
    const u = new URL(value, "https://glf.invalid");
    return u.origin === "https://glf.invalid" &&
      /^\/(?:applicant|internal|documents|files|security)(?:\/|$)/.test(
        u.pathname,
      )
      ? u.pathname + u.search
      : fallback;
  } catch {
    return fallback;
  }
}
export function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
export function financialErrors(
  c: Concept,
  rules: Rules,
): Partial<Record<keyof Concept, string>> {
  const errors: Partial<Record<keyof Concept, string>> = {};
  const category = rules.categories.find((item) => item.id === c.category_id);
  if (
    category &&
    c.requested_amount !== null &&
    (c.requested_amount <= 0 ||
      c.requested_amount < category.min_amount ||
      (category.max_amount !== null &&
        c.requested_amount > category.max_amount))
  )
    errors.requested_amount = "CATEGORY_AMOUNT";
  if (
    category &&
    c.requested_amount !== null &&
    c.cofinance_amount !== null &&
    c.cofinance_amount < (c.requested_amount * category.cofinance_percent) / 100
  )
    errors.cofinance_amount = "COFINANCE";
  if (
    c.admin_cost !== null &&
    c.requested_amount !== null &&
    c.cofinance_amount !== null &&
    c.admin_cost >
      ((c.requested_amount + c.cofinance_amount) * rules.max_admin_percent) /
        100
  )
    errors.admin_cost = "ADMIN_LIMIT";
  return errors;
}
export function validateComplete(
  payload: Payload,
  rules: Rules,
  stage: number,
): string[] {
  const missing: string[] = [];
  const c = payload.concept;
  missing.push(...Object.keys(financialErrors(c, rules)));
  if (c.phone && !normalizePhone(c.phone)) missing.push("phone");
  for (const [key, value] of Object.entries(c)) {
    if (
      key !== "partners" &&
      (value === null || (typeof value === "string" && !value.trim()))
    )
      missing.push(key);
  }
  if (c.summary && words(c.summary) > rules.summary_word_limit)
    missing.push("summary_word_limit");
  if (!payload.activities.length) missing.push("activities");
  payload.activities.forEach((a, i) => {
    if (!a.title.trim() || !a.description.trim())
      missing.push("activity_" + (i + 1));
    if (!a.risks.length && !a.no_risks_reason.trim())
      missing.push("no_risks_reason_" + (i + 1));
    a.risks.forEach((r, j) => {
      if (
        [
          r.name,
          r.description,
          ...(stage === 2 ? [r.location, r.responsible] : []),
        ].some((v) => !v.trim()) ||
        [
          r.probability,
          r.severity,
          ...(stage === 2
            ? [
                r.residual_probability,
                r.residual_severity,
                r.cost,
                r.start_quarter,
                r.end_quarter,
              ]
            : []),
        ].some((v) => v === null) ||
        (stage === 2 &&
          (!r.measures.length ||
            r.measures.some((m) => !m.catalog_id && !m.text?.trim())))
      )
        missing.push("risk_" + (i + 1) + "_" + (j + 1));
      if (
        stage === 2 &&
        r.start_quarter &&
        r.end_quarter &&
        r.end_quarter < r.start_quarter
      )
        missing.push("quarters_" + (i + 1) + "_" + (j + 1));
    });
  });
  if (!payload.consent || !payload.truthful) missing.push("declarations");
  return missing;
}
