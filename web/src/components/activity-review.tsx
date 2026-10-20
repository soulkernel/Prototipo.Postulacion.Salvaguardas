import type { Activity, Concept, Locale } from "@/lib/domain";
import { activityScheduleRows } from "@/lib/activity-planning";
import { proposalTitle } from "@/lib/proposal-guidance";
export function ActivityDatesTable({
  activity,
  locale,
}: {
  activity: Activity;
  locale: Locale;
}) {
  const rows = activityScheduleRows(activity, locale);
  if (!rows.length) return null;
  return (
    <table className="concept-review-table activity-schedule-table">
      <caption>
        {locale === "es"
          ? "Planificación preliminar de la actividad"
          : "Preliminary activity schedule"}
      </caption>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function ActivityReview({
  activities,
  concept,
  locale,
}: {
  activities: Activity[];
  concept: Concept;
  locale: Locale;
}) {
  const es = locale === "es";
  return (
    <section
      className="concept-review-section"
      aria-label={proposalTitle("activities", locale)}
    >
      <h3>{proposalTitle("activities", locale)}</h3>
      <p>
        {es
          ? "Estas son las actividades propuestas para alcanzar los objetivos específicos. Las fechas que se indiquen son preliminares y se conservarán al avanzar al proyecto completo."
          : "These are the proposed activities to achieve the specific objectives. Any dates shown are preliminary and are retained when progressing to the full proposal."}
      </p>
      {activities.map((activity, index) => (
        <article key={activity.id} className="activity-review-item">
          <h4>
            {es ? "Actividad" : "Activity"} {index + 1}: {activity.title || "—"}
          </h4>
          <p className="preserve-text">{activity.description || "—"}</p>
          {!!activity.objective_ids?.length && (
            <p>
              {es ? "Contribuye a: " : "Contributes to: "}
              {activity.objective_ids
                .map(
                  (id) =>
                    concept.strategic_alignment?.objectives.find(
                      (o) => o.id === id,
                    )?.text ||
                    (es
                      ? "Objetivo pendiente de revisar"
                      : "Objective pending review"),
                )
                .join("; ")}
            </p>
          )}
          <ActivityDatesTable activity={activity} locale={locale} />
        </article>
      ))}
    </section>
  );
}
