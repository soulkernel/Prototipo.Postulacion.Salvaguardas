import type { Payload } from "./domain";
export function activityPlanningIssues(payload: Payload): string[] {
  const issues: string[] = [];
  if (!payload.activities.length) issues.push("activities");
  payload.activities.forEach((activity, i) => {
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
