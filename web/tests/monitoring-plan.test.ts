import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  emptyPayload,
  newActivity,
  payloadSchema,
  validateComplete,
  type Rules,
} from "../src/lib/domain";
import { newProjectResult } from "../src/lib/project-results";
import {
  newObjective,
  currentAlignmentVersion,
} from "../src/lib/strategic-alignment";
import {
  newMonitoringItem,
  monitoringIssues,
  monitoringEntryIssues,
  monitoringPlanSchema,
  monitoringReference,
  monitoringText,
  monitoredObjectiveIds,
} from "../src/lib/monitoring-plan";
import { completionGuidance } from "../src/lib/completion-guidance";
import { stepIssues } from "../src/lib/step-validation";
import { conceptSections } from "../src/lib/concept-presentation";
import { ConceptReview } from "../src/components/concept-review";
import { MonitoringFields } from "../src/components/monitoring-fields";
import {
  currentConceptLayout,
  resultsConceptLayout,
} from "../src/lib/concept-layout";

function fixture() {
  const p = emptyPayload();
  const general = {
    ...newObjective("general", currentAlignmentVersion),
    text: "Propósito general",
    plan: ["E1"],
    ods: [14],
  };
  const a = {
      ...newObjective("specific", currentAlignmentVersion),
      text: "OBJETIVO_A",
    },
    b = {
      ...newObjective("specific", currentAlignmentVersion),
      text: "OBJETIVO_B",
    };
  p.concept.strategic_alignment = {
    version: currentAlignmentVersion,
    objectives: [general, a, b],
  };
  p.concept.project_results = [
    { ...newProjectResult(), objective_id: a.id, result: "RESULTADO_A" },
    { ...newProjectResult(), objective_id: b.id, result: "RESULTADO_B" },
  ];
  p.activities = [
    {
      ...newActivity(),
      title: "ACTIVIDAD_A",
      description: "Plan A",
      objective_ids: [a.id],
    },
    {
      ...newActivity(),
      title: "ACTIVIDAD_MULTIPLE",
      description: "Plan B",
      objective_ids: [a.id, b.id],
    },
  ];
  p.concept.monitoring = "TEXTO_HISTORICO_SIN_CAMBIOS";
  p.concept.monitoring_plan = [
    {
      ...newMonitoringItem(),
      parameter: "activity",
      reference_id: p.activities[1].id,
      indicator: "INDICADOR_AVANCE",
      strategy: "ESTRATEGIA_AVANCE",
    },
    {
      ...newMonitoringItem(),
      parameter: "result",
      reference_id: p.concept.project_results[1].id,
      indicator: "INDICADOR_LOGRO",
      strategy: "ESTRATEGIA_LOGRO",
    },
  ];
  return p;
}
test("linked plan validates incomplete drafts, strict schema and explicit references", () => {
  const p = fixture(),
    before = structuredClone(p);
  assert.equal(payloadSchema.safeParse(p).success, true);
  const withoutLegacy = structuredClone(p) as unknown as {
    concept: Record<string, unknown>;
  };
  delete withoutLegacy.concept.monitoring;
  assert.equal(payloadSchema.parse(withoutLegacy).concept.monitoring, "");
  assert.deepEqual(monitoringIssues(p), []);
  assert.equal(
    monitoringPlanSchema.safeParse([newMonitoringItem()]).success,
    true,
  );
  const blank = {
    ...p,
    concept: { ...p.concept, monitoring_plan: [newMonitoringItem()] },
  };
  assert.deepEqual(monitoringIssues(blank), ["monitoring_1"]);
  assert.deepEqual(
    monitoringEntryIssues(blank, blank.concept.monitoring_plan[0]),
    ["parameter", "reference_id", "indicator", "strategy"],
  );
  for (const value of [
    [...p.concept.monitoring_plan!, p.concept.monitoring_plan![0]],
    [{ ...newMonitoringItem(), reference_id: "fake" }],
    [{ ...newMonitoringItem(), indicator: "x".repeat(1001) }],
    [{ ...newMonitoringItem(), strategy: "x".repeat(2001) }],
    [{ ...newMonitoringItem(), target: 4 }],
  ])
    assert.equal(monitoringPlanSchema.safeParse(value).success, false);
  assert.deepEqual(p, before);
});
test("activity and result references inherit only their actual specific objectives", () => {
  const p = fixture();
  assert.deepEqual(
    new Set(monitoredObjectiveIds(p)),
    new Set(
      p.concept
        .strategic_alignment!.objectives.filter((o) => o.kind === "specific")
        .map((o) => o.id),
    ),
  );
  assert.deepEqual(
    monitoringReference(p, p.concept.monitoring_plan![0], "es").objectives,
    ["OBJETIVO_A", "OBJETIVO_B"],
  );
  assert.deepEqual(
    monitoringReference(p, p.concept.monitoring_plan![1], "en").objectives,
    ["OBJETIVO_B"],
  );
  const row = p.concept.monitoring_plan![1];
  for (const patch of [
    { reference_id: crypto.randomUUID() },
    { parameter: "activity" as const },
    { indicator: " " },
    { strategy: "" },
  ]) {
    const bad = structuredClone(p);
    Object.assign(bad.concept.monitoring_plan![1], patch);
    assert.deepEqual(monitoringIssues(bad), ["monitoring_2"]);
  }
  const old = structuredClone(p.concept.monitoring_plan);
  p.activities.reverse();
  p.concept.project_results!.reverse();
  p.concept.strategic_alignment!.objectives.reverse();
  p.activities[0].title = "RENOMBRADA";
  assert.match(
    monitoringReference(p, p.concept.monitoring_plan![0], "es").label,
    /RENOMBRADA/,
  );
  assert.deepEqual(p.concept.monitoring_plan, old);
  p.activities = [];
  assert.deepEqual(monitoringIssues(p), ["monitoring_1"]);
  assert.equal(p.concept.monitoring_plan![0].indicator, "INDICADOR_AVANCE");
  p.concept.strategic_alignment!.objectives = [];
  assert.deepEqual(monitoringIssues(p), ["monitoring_1", "monitoring_2"]);
  assert.equal(row.reference_id, old![1].reference_id);
});
test("completion points to each real monitoring field in both phases and languages", () => {
  const p = fixture(),
    rules = {
      categories: [],
      summary_word_limit: 500,
      max_admin_percent: 10,
    } as unknown as Rules;
  for (const stage of [1, 2])
    for (const locale of ["es", "en"] as const) {
      assert.ok(
        !validateComplete(p, rules, stage).some((k) =>
          k.startsWith("monitoring"),
        ),
      );
      assert.ok(
        !stepIssues(p, rules, stage, 1).missing.some((k) =>
          k.startsWith("monitoring"),
        ),
      );
      p.concept.monitoring_plan![0].strategy = "";
      const found = completionGuidance(p, rules, stage, [], locale).filter(
        (i) => i.id.startsWith("monitoring-"),
      );
      assert.equal(found.length, 1);
      assert.equal(found[0].id, "monitoring-0-strategy");
      assert.match(found[0].selector, /data-validation-monitoring="1"/);
      assert.doesNotMatch(found[0].text, /monitoring_1/);
      p.concept.monitoring_plan![0].strategy = "ESTRATEGIA_AVANCE";
    }
});
test("legacy text is preserved verbatim and active/frozen presentation uses the right source", () => {
  const p = fixture(),
    before = structuredClone(p);
  for (const locale of ["es", "en"] as const) {
    const plan = conceptSections(
      p.concept,
      locale,
      undefined,
      { stage: 1, layoutVersion: currentConceptLayout },
      p.activities,
    ).find((s) => s.id === "monitoring")!;
    const text = JSON.stringify(plan);
    assert.match(text, /INDICADOR_AVANCE/);
    assert.match(text, /ACTIVIDAD_MULTIPLE/);
    assert.match(text, /OBJETIVO_A/);
    assert.match(text, /INDICADOR_LOGRO/);
    assert.doesNotMatch(text, /TEXTO_HISTORICO/);
    assert.ok(
      text.includes(
        locale === "es"
          ? "Parámetro de evaluación que propone"
          : "Proposed evaluation parameter",
      ),
    );
    const historic = conceptSections(
      p.concept,
      locale,
      undefined,
      { stage: 1, layoutVersion: resultsConceptLayout },
      p.activities,
    ).find((s) => s.id === "monitoring")!;
    assert.match(JSON.stringify(historic), /TEXTO_HISTORICO_SIN_CAMBIOS/);
    assert.doesNotMatch(JSON.stringify(historic), /INDICADOR_AVANCE/);
    const html = renderToStaticMarkup(
      createElement(ConceptReview, {
        concept: p.concept,
        locale,
        activities: p.activities,
        includeActivities: true,
      }),
    );
    const activityStart = html.indexOf(
      'aria-label="' + (locale === "es" ? "Actividades" : "Activities") + '"',
    );
    assert.ok(activityStart >= 0);
    assert.ok(
      html.indexOf(
        'aria-label="' +
          (locale === "es"
            ? "Seguimiento y evaluación"
            : "Monitoring and evaluation") +
          '"',
      ) > activityStart,
    );
    assert.match(monitoringText(p, locale), /INDICADOR_LOGRO/);
  }
  assert.deepEqual(p, before);
  delete p.concept.monitoring_plan;
  assert.deepEqual(monitoringIssues(p), []);
  assert.equal(monitoringText(p), p.concept.monitoring);
});
test("entry labels, empty first card and keyboard controls match the approved capture", () => {
  const p = fixture();
  p.concept.monitoring_plan = [];
  for (const locale of ["es", "en"] as const) {
    const html = renderToStaticMarkup(
      createElement(MonitoringFields, {
        payload: p,
        locale,
        checked: false,
        onChange: () => {},
      }),
    );
    assert.ok(
      html.includes(
        locale === "es"
          ? "Parámetro de evaluación que propone"
          : "Proposed evaluation parameter",
      ),
    );
    assert.doesNotMatch(html, /Qué desea evaluar/);
    assert.match(html, /data-validation-field="parameter"/);
    assert.match(html, /data-validation-field="reference_id"/);
    assert.match(html, /aria-required="true"/);
    assert.doesNotMatch(html, /aria-invalid="true"/);
    assert.equal(p.concept.monitoring_plan.length, 0);
  }
  const props = {
    payload: p,
    locale: "es" as const,
    checked: false,
    onChange: () => {},
  };
  assert.equal(
    renderToStaticMarkup(createElement(MonitoringFields, props)),
    renderToStaticMarkup(createElement(MonitoringFields, props)),
    "An empty card must not expose random IDs in server-rendered attributes",
  );
});
