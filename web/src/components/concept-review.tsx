import type { Activity, Concept, Locale } from "@/lib/domain";
import { ActivityReview } from "./activity-review";
import { conceptSections } from "@/lib/concept-presentation";
import {
  currentConceptLayout,
  usesStructuredMonitoring,
  type ConceptPresentation,
} from "@/lib/concept-layout";

export function ConceptReview({
  concept,
  locale,
  rules,
  presentation,
  activities = [],
  includeActivities = false,
}: {
  concept: Concept;
  locale: Locale;
  rules?: unknown;
  presentation?: ConceptPresentation;
  activities?: Activity[];
  includeActivities?: boolean;
}) {
  const sections = conceptSections(
    concept,
    locale,
    rules,
    presentation,
    activities,
  );
  const afterActivities =
    includeActivities &&
    usesStructuredMonitoring(
      presentation || { stage: 1, layoutVersion: currentConceptLayout },
    );
  const renderSections = (items: typeof sections) =>
    items.map((section) => (
      <section
        key={section.id}
        className="concept-review-section"
        aria-label={section.title}
      >
        <h3>{section.title}</h3>
        <p className="concept-review-introduction">{section.introduction}</p>
        {section.blocks.map((block, index) =>
          block.type === "paragraph" ? (
            <p className="concept-review-paragraph" key={index}>
              {block.text}
            </p>
          ) : (
            <div
              className="concept-table-scroll"
              role="region"
              aria-label={section.title}
              tabIndex={0}
              key={index}
            >
              <table
                className={`concept-review-table concept-columns-${block.headers.length}`}
              >
                <caption className="sr-only">{section.title}</caption>
                <thead>
                  <tr>
                    {block.headers.map((label, i) => (
                      <th scope="col" key={i}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        )}
      </section>
    ));
  return (
    <div className="concept-review">
      {renderSections(
        afterActivities
          ? sections.filter((s) => s.id !== "monitoring")
          : sections,
      )}
      {includeActivities && (
        <ActivityReview
          activities={activities}
          concept={concept}
          locale={locale}
        />
      )}
      {afterActivities &&
        renderSections(sections.filter((s) => s.id === "monitoring"))}
    </div>
  );
}
