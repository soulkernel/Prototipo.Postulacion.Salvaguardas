import type { Concept, Rules } from "./domain";

export function identificationIssue(c: Concept): string | undefined {
  return identificationIssues(c)[0];
}
export function identificationIssues(c: Concept): string[] {
  const issues: string[] = [];
  if (
    c.applicant_type === "individual" &&
    !/^[\p{L}\p{N}][\p{L}\p{N} -]{0,49}$/u.test(
      c.residence_number?.trim() || "",
    )
  )
    issues.push("residence_number");
  if (
    c.applicant_type === "individual" &&
    !/^\d{10}$/.test(c.identity_number || "")
  )
    issues.push("identity_number");
  if (
    c.applicant_type === "organization" &&
    !/^\d{13}$/.test(c.ruc?.trim() || "")
  )
    issues.push("ruc");
  return issues;
}
export function maxProjectEnd(
  start: string,
  months: number,
): string | undefined {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isInteger(months) ||
    months < 1
  )
    return;
  const date = new Date(start + "T00:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== start
  )
    return;
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
export function projectDateErrors(
  c: Concept,
  rules: Rules,
): Partial<Record<"start_date" | "end_date", string>> {
  const errors: Partial<Record<"start_date" | "end_date", string>> = {};
  for (const key of ["start_date", "end_date"] as const) {
    if (c[key] && !maxProjectEnd(c[key], 1)) errors[key] = "INVALID_DATES";
  }
  if (c.start_date && c.end_date && !Object.keys(errors).length) {
    if (c.end_date <= c.start_date) errors.end_date = "INVALID_DATES";
    const category = rules.categories.find((x) => x.id === c.category_id);
    const max = category && maxProjectEnd(c.start_date, category.max_months);
    if (max && c.end_date > max) errors.end_date = "CATEGORY_DURATION";
  }
  return errors;
}
