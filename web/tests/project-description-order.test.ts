import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { emptyPayload } from "../src/lib/domain";
import { conceptSections } from "../src/lib/concept-presentation";
import { ConceptReview } from "../src/components/concept-review";
import {
  currentConceptLayout,
  sustainabilityConceptLayout,
  projectDescriptionOrder,
  conceptSectionOrder,
  usesStructuredMonitoring,
  usesStructuredSustainability,
  includesDetailedResults,
} from "../src/lib/concept-layout";

test("new review follows the capture sequence in both languages and stages, without duplicating activities or changing payloads", () => {
  const p = emptyPayload();
  for (const key of projectDescriptionOrder)
    if (key !== "activities") Object.assign(p.concept, { [key]: `QA_${key}` });
  p.concept.partner_organizations = [
    { id: crypto.randomUUID(), name: "Socio QA", support: "Apoyo QA" },
  ];
  const before = structuredClone(p);
  for (const locale of ["es", "en"] as const)
    for (const stage of [1, 2]) {
      const presentation = { stage, layoutVersion: currentConceptLayout };
      const sections = conceptSections(
        p.concept,
        locale,
        undefined,
        presentation,
        p.activities,
      );
      assert.deepEqual(
        sections.map((s) => s.id),
        conceptSectionOrder.filter((id) => id !== "activities"),
      );
      const html = renderToStaticMarkup(
        createElement(ConceptReview, {
          concept: p.concept,
          locale,
          activities: p.activities,
          includeActivities: true,
          presentation,
        }),
      );
      const headings = [
        ...html.matchAll(
          /class="concept-review-section" aria-label="([^"]+)"/g,
        ),
      ].map((m) => m[1]);
      const expected = conceptSectionOrder.map((id) =>
        id === "activities"
          ? locale === "es"
            ? "Actividades"
            : "Activities"
          : sections.find((s) => s.id === id)!.title,
      );
      assert.deepEqual(headings, expected);
    }
  assert.deepEqual(p, before);
});

test("v5 keeps its previous review sequence and stage-specific content while v6 changes presentation only", () => {
  const p = emptyPayload(),
    presentation = { stage: 1, layoutVersion: sustainabilityConceptLayout };
  assert.equal(usesStructuredMonitoring(presentation), true);
  assert.equal(usesStructuredSustainability(presentation), true);
  assert.equal(includesDetailedResults(presentation), false);
  assert.equal(includesDetailedResults({ ...presentation, stage: 2 }), true);
  const sections = conceptSections(p.concept, "es", undefined, presentation);
  assert.deepEqual(
    sections.map((s) => s.id),
    [
      "general",
      "duration",
      "financing",
      "summary",
      "objectives",
      "beneficiaries",
      "results",
      "alignment",
      "monitoring",
      "environmental_risks",
      "social_risks",
      "sustainability",
    ],
  );
  const html = renderToStaticMarkup(
    createElement(ConceptReview, {
      concept: p.concept,
      locale: "es",
      presentation,
      includeActivities: true,
    }),
  );
  const labels = [
    ...html.matchAll(/class="concept-review-section" aria-label="([^"]+)"/g),
  ].map((m) => m[1]);
  assert.ok(
    labels.indexOf("Actividades") >
      labels.indexOf("Riesgos sociales potenciales"),
  );
  assert.ok(
    labels.indexOf("Seguimiento y evaluación") > labels.indexOf("Actividades"),
  );
  assert.equal(labels.at(-1), "Sostenibilidad y replicabilidad");
});
