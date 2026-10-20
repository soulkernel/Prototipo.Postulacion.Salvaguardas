import type { Activity, Concept, Locale } from "@/lib/domain";
import { ActivityReview } from "./activity-review";
import { conceptSections } from "@/lib/concept-presentation";
import {
  currentConceptLayout,
  conceptSectionOrder,
  usesOrderedProjectDescription,
  usesStructuredMonitoring,
  usesStructuredSustainability,
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
  const view = presentation || {
    stage: 1,
    layoutVersion: currentConceptLayout,
  };
  const afterActivities = includeActivities && usesStructuredMonitoring(view);
  const deferred = (section: (typeof sections)[number]) =>
    afterActivities &&
    (section.id === "monitoring" ||
      (section.id === "sustainability" && usesStructuredSustainability(view)));
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
  if (usesOrderedProjectDescription(view))
    return (
      <div className="concept-review">
        {conceptSectionOrder.map((id) =>
          id === "activities" ? (
            includeActivities ? (
              <ActivityReview
                key={id}
                activities={activities}
                concept={concept}
                locale={locale}
              />
            ) : null
          ) : (
            renderSections(sections.filter((section) => section.id === id))
          ),
        )}
      </div>
    );
  return (
    <div className="concept-review">
      {renderSections(sections.filter((section) => !deferred(section)))}
      {includeActivities && (
        <ActivityReview
          activities={activities}
          concept={concept}
          locale={locale}
        />
      )}
      {afterActivities && renderSections(sections.filter(deferred))}
    </div>
  );
}
