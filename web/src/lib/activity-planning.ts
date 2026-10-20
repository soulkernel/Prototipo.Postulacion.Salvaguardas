import { maxProjectEnd } from "./applicant-validation";
import type { Activity, Concept, Locale, Payload } from "./domain";
export function activityPlanningIssues(payload: Payload): string[] {
  const issues: string[] = [];
  if (!payload.activities.length) issues.push("activities");
  payload.activities.forEach((activity, i) => {
    for (const key of Object.keys(
      activityDateErrors(activity, payload.concept),
    ))
      issues.push(`activity_dates_${key}_${i + 1}`);
    if (!activity.title.trim() || !activity.description.trim())
      issues.push(`activity_${i + 1}`);
    const objectives = payload.concept.strategic_alignment?.objectives.filter(
      (o) => o.kind === "specific",
    );
    if (
      objectives &&
      (!activity.objective_ids?.length ||
        activity.objective_ids.some(
          (id) => !objectives.some((o) => o.id === id && o.text.trim()),
        ))
    )
      issues.push(`activity_objectives_${i + 1}`);
  });
  return issues;
}

export function isActivityDate(value: string): boolean {
  return !!maxProjectEnd(value, 1);
}
export type ActivityDateIssue = "required" | "invalid" | "order" | "range";
export function activityDateErrors(
  activity: Pick<Activity, "start_date" | "end_date">,
  project: Pick<Concept, "start_date" | "end_date">,
): Partial<Record<"start_date" | "end_date", ActivityDateIssue>> {
  const start = activity.start_date || "",
    end = activity.end_date || "";
  const errors: Partial<Record<"start_date" | "end_date", ActivityDateIssue>> =
    {};
  if (!start && !end) return errors;
  for (const key of ["start_date", "end_date"] as const) {
    const value = activity[key];
    if (!value) errors[key] = "required";
    else if (!isActivityDate(value)) errors[key] = "invalid";
    else if (
      (isActivityDate(project.start_date) && value < project.start_date) ||
      (isActivityDate(project.end_date) && value > project.end_date)
    )
      errors[key] = "range";
  }
  if (isActivityDate(start) && isActivityDate(end) && end < start)
    errors.end_date = "order";
  return errors;
}
export function activityDateMessage(
  issue: ActivityDateIssue,
  locale: Locale,
): string {
  const messages = {
    required: [
      "Complete las dos fechas de la actividad o deje ambas vacías para continuar.",
      "Complete both activity dates or leave both blank to continue.",
    ],
    invalid: [
      "Ingrese una fecha válida para la actividad.",
      "Enter a valid activity date.",
    ],
    order: [
      "La finalización de la actividad no puede ser anterior a su inicio.",
      "The activity end date cannot be before its start date.",
    ],
    range: [
      "Las fechas de la actividad deben estar dentro del período del proyecto. Revise esta actividad o las fechas generales.",
      "Activity dates must fall within the project period. Review this activity or the overall project dates.",
    ],
  };
  return messages[issue][locale === "es" ? 0 : 1];
}
export function activityScheduleRows(
  activity: Pick<Activity, "start_date" | "end_date">,
  locale: Locale,
): string[][] {
  if (!activity.start_date && !activity.end_date) return [];
  const date = (value?: string) =>
    isActivityDate(value || "")
      ? new Intl.DateTimeFormat(locale === "es" ? "es-EC" : "en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(value + "T00:00:00Z"))
      : value || (locale === "es" ? "Pendiente de completar" : "Incomplete");
  return [
    [
      locale === "es" ? "Fecha prevista de inicio" : "Planned start date",
      date(activity.start_date),
    ],
    [
      locale === "es" ? "Fecha prevista de finalización" : "Planned end date",
      date(activity.end_date),
    ],
  ];
}
