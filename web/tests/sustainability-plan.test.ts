import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  emptyPayload,
  newActivity,
  payloadSchema,
  validateComplete,
} from "../src/lib/domain";
import { newProjectResult } from "../src/lib/project-results";
import {
  newObjective,
  currentAlignmentVersion,
} from "../src/lib/strategic-alignment";
import { newMonitoringItem } from "../src/lib/monitoring-plan";
import {
  newSustainabilityItem,
  sustainabilityPlanSchema,
  sustainabilityIssues,
  sustainabilityEntryIssues,
  sustainabilityReference,
  sustainabilityActor,
  linkedSustainabilityCount,
  sustainabilityObjectiveIds,
} from "../src/lib/sustainability-plan";
import type { Rules } from "../src/lib/domain";
const defaultRules: Rules = {
  categories: [],
  applicant_types: ["individual", "organization"],
  themes: [],
  summary_word_limit: 500,
  max_admin_percent: 10,
  required_attachments: [],
  privacy_es: "",
  privacy_en: "",
};
import { stepIssues } from "../src/lib/step-validation";
import { completionGuidance } from "../src/lib/completion-guidance";
import { conceptSections } from "../src/lib/concept-presentation";
import {
  currentConceptLayout,
  monitoringConceptLayout,
} from "../src/lib/concept-layout";
import { ConceptReview } from "../src/components/concept-review";
import { SustainabilityFields } from "../src/components/sustainability-fields";

function fixture() {
  const p = emptyPayload(),
    a = {
      ...newObjective("specific", currentAlignmentVersion),
      text: "OBJETIVO_A",
    },
    b = {
      ...newObjective("specific", currentAlignmentVersion),
      text: "OBJETIVO_B",
    };
  p.concept.strategic_alignment = {
    version: currentAlignmentVersion,
    objectives: [
      {
        ...newObjective("general", currentAlignmentVersion),
        text: "Propósito general",
        plan: ["E1"],
        ods: [14],
      },
      a,
      b,
    ],
  };
  p.concept.applicant_name = "PROPONENTE_QA";
  p.concept.partner_organizations = [
    { id: crypto.randomUUID(), name: "SOCIO_QA", support: "Apoyo ficticio" },
  ];
  p.activities = [
    {
      ...newActivity(),
      title: "ACTIVIDAD_QA",
      description: "Actividad de prueba",
      objective_ids: [a.id, b.id],
    },
  ];
  p.concept.project_results = [
    { ...newProjectResult(), objective_id: b.id, result: "RESULTADO_QA" },
  ];
  p.concept.monitoring_plan = [
    {
      ...newMonitoringItem(),
      parameter: "activity",
      reference_id: p.activities[0].id,
      indicator: "INDICADOR_QA",
      strategy: "Revisar registros",
    },
  ];
  p.concept.sustainability = "TEXTO_HISTORICO_SOSTENIBILIDAD";
  p.concept.sustainability_plan = [
    {
      ...newSustainabilityItem(),
      references: [
        { type: "activity", id: p.activities[0].id },
        { type: "result", id: p.concept.project_results[0].id },
      ],
      strategy: "ESTRATEGIA_CONTINUIDAD_QA",
      actor_type: "partner",
      actor_id: p.concept.partner_organizations[0].id,
      replication: "both",
      replication_details: "CONDICIONES_REPLICA_QA",
      monitoring_id: p.concept.monitoring_plan[0].id,
    },
  ];
  return p;
}
test("sustainability schemas allow incomplete drafts and reject malformed or duplicated records", () => {
  const p = fixture(),
    item = p.concept.sustainability_plan![0];
  assert.equal(payloadSchema.safeParse(p).success, true);
  assert.equal(
    sustainabilityPlanSchema.safeParse([newSustainabilityItem()]).success,
    true,
  );
  assert.deepEqual(sustainabilityIssues(p), []);
  for (const plan of [
    [item, item],
    [{ ...item, references: [item.references[0], item.references[0]] }],
    [{ ...item, references: [{ type: "general", id: item.id }] }],
    [{ ...item, actor_type: "applicant" }],
    [{ ...item, monitoring_id: "foreign" }],
    [{ ...item, target: 5 }],
    [{ ...item, strategy: "x".repeat(12001) }],
    [{ ...item, actor_name: "x".repeat(201) }],
  ])
    assert.equal(sustainabilityPlanSchema.safeParse(plan).success, false);
  const copy = structuredClone(p) as unknown as {
    concept: Record<string, unknown>;
  };
  delete copy.concept.sustainability;
  assert.equal(payloadSchema.parse(copy).concept.sustainability, "");
});
test("sustainability preserves actual references, partners and indicators through rename/reorder; deletions remain pending", () => {
  const p = fixture(),
    saved = structuredClone(p.concept.sustainability_plan),
    item = p.concept.sustainability_plan![0];
  assert.deepEqual(
    sustainabilityReference(p, item.references[0], "es").objectives,
    ["OBJETIVO_A", "OBJETIVO_B"],
  );
  assert.equal(sustainabilityObjectiveIds(p).length, 2);
  assert.equal(
    linkedSustainabilityCount(p, "monitoring", item.monitoring_id),
    1,
  );
  p.concept.partner_organizations![0].name = "SOCIO_RENOMBRADO";
  p.concept.project_results![0].result = "RESULTADO_RENOMBRADO";
  p.concept.strategic_alignment!.objectives.reverse();
  assert.equal(sustainabilityActor(p, item, "es"), "SOCIO_RENOMBRADO");
  assert.match(
    sustainabilityReference(p, item.references[1], "es").label,
    /RESULTADO_RENOMBRADO/,
  );
  assert.deepEqual(sustainabilityIssues(p), []);
  assert.deepEqual(p.concept.sustainability_plan, saved);
  p.activities = [];
  p.concept.partner_organizations = [];
  p.concept.monitoring_plan = [];
  assert.deepEqual(sustainabilityEntryIssues(p, item), [
    "references",
    "actor_id",
    "monitoring_id",
  ]);
  assert.deepEqual(p.concept.sustainability_plan, saved);
});
test("sustainability conditions and optional links are coherent in both phases and completion guidance ES/EN", () => {
  const p = fixture(),
    item = p.concept.sustainability_plan![0];
  p.concept.sustainability = "";
  for (const stage of [1, 2]) {
    assert.ok(
      !validateComplete(p, defaultRules, stage).some((k) =>
        k.startsWith("sustainability"),
      ),
    );
    assert.ok(
      !stepIssues(p, defaultRules, stage, 1).missing.some((k) =>
        k.startsWith("sustainability"),
      ),
    );
  }
  item.actor_type = "other";
  item.actor_id = "";
  item.actor_name = "";
  item.replication = "undecided";
  item.monitoring_id = "";
  assert.deepEqual(sustainabilityEntryIssues(p, item), ["actor_name"]);
  for (const locale of ["es", "en"] as const) {
    const issue = completionGuidance(p, defaultRules, 1, [], locale).find(
      (i) => i.id === "sustainability-0-actor_name",
    )!;
    assert.match(issue.selector, /data-validation-sustainability="1"/);
    assert.ok(!issue.text.includes("sustainability_1"));
  }
  item.actor_name = "Actor ficticio";
  item.replication = "none";
  assert.deepEqual(sustainabilityIssues(p), []);
  item.replication_details = " ";
  assert.deepEqual(sustainabilityEntryIssues(p, item), ["replication_details"]);
  item.actor_type = "undecided";
  item.actor_name = "";
  item.replication_details = "Por definir en la propuesta completa";
  assert.deepEqual(sustainabilityIssues(p), []);
  item.references[0].id = crypto.randomUUID();
  assert.deepEqual(sustainabilityIssues(p), ["sustainability_1"]);
});
test("current review has natural explanation and sustainability after monitoring; v4 and legacy texts are preserved", () => {
  const p = fixture(),
    before = structuredClone(p);
  for (const locale of ["es", "en"] as const) {
    const section = conceptSections(
      p.concept,
      locale,
      defaultRules,
      { stage: 1, layoutVersion: currentConceptLayout },
      p.activities,
    ).find((s) => s.id === "sustainability")!;
    assert.equal(section.blocks[0].type, "paragraph");
    assert.match(JSON.stringify(section), /ESTRATEGIA_CONTINUIDAD_QA/);
    assert.doesNotMatch(
      JSON.stringify(section),
      /TEXTO_HISTORICO_SOSTENIBILIDAD/,
    );
    const historic = conceptSections(
      p.concept,
      locale,
      defaultRules,
      { stage: 1, layoutVersion: monitoringConceptLayout },
      p.activities,
    ).find((s) => s.id === "sustainability")!;
    assert.match(JSON.stringify(historic), /TEXTO_HISTORICO_SOSTENIBILIDAD/);
    assert.doesNotMatch(JSON.stringify(historic), /ESTRATEGIA_CONTINUIDAD_QA/);
    const html = renderToStaticMarkup(
      createElement(ConceptReview, {
        concept: p.concept,
        locale,
        activities: p.activities,
        includeActivities: true,
      }),
    );
    const monitoring = html.indexOf(
        `aria-label="${locale === "es" ? "Seguimiento y evaluación" : "Monitoring and evaluation"}"`,
      ),
      sustainability = html.indexOf(
        `aria-label="${locale === "es" ? "Sostenibilidad y replicabilidad" : "Sustainability and replication"}"`,
      );
    assert.ok(monitoring > 0 && sustainability > monitoring);
  }
  assert.deepEqual(p, before);
  delete p.concept.sustainability_plan;
  assert.deepEqual(sustainabilityIssues(p), []);
  p.concept.sustainability = "";
  assert.deepEqual(sustainabilityIssues(p), ["sustainability"]);
});
test("sustainability entry has a stable empty SSR card, optional monitoring and editable legacy narrative", () => {
  const p = fixture();
  p.concept.sustainability_plan = [];
  for (const locale of ["es", "en"] as const) {
    const render = () =>
      renderToStaticMarkup(
        createElement(SustainabilityFields, {
          payload: p,
          locale,
          checked: false,
          onChange: () => {
            throw new Error("Opening must not save");
          },
        }),
      );
    const html = render();
    assert.equal(html, render());
    assert.match(html, /sustainability-card/);
    assert.match(html, /data-validation-field="replication_details"/);
    assert.equal(
      (html.match(/data-validation-sustainability=/g) || []).length,
      1,
    );
    assert.match(
      html,
      locale === "es"
        ? /Vincular un indicador de seguimiento — opcional/
        : /Link a monitoring indicator — optional/,
    );
    delete p.concept.sustainability_plan;
    const legacy = render();
    assert.match(legacy, /TEXTO_HISTORICO_SOSTENIBILIDAD/);
    assert.doesNotMatch(legacy, /data-validation-sustainability=/);
    p.concept.sustainability_plan = [];
  }
});
