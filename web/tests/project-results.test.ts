import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newProjectResult,
  resultIssues,
  resultText,
  projectResultSchema,
} from "../src/lib/project-results";
import { emptyPayload, validateComplete, type Rules } from "../src/lib/domain";
import { stepIssues } from "../src/lib/step-validation";
import { completionGuidance } from "../src/lib/completion-guidance";
import { conceptSections } from "../src/lib/concept-presentation";
import {
  currentConceptLayout,
  previousGlfConceptLayout,
} from "../src/lib/concept-layout";
const objective = {
  id: crypto.randomUUID(),
  kind: "specific",
  text: "Fortalecer capacidades locales",
};
const result = {
  ...newProjectResult(),
  objective_id: objective.id,
  result: "Jóvenes capacitados",
  indicator: "Número de jóvenes que completan el curso",
  target: 60,
  unit: "people" as const,
  evidence: "Asistencia y evaluación",
};
test("preserves historical narrative without implicit conversion", () => {
  assert.equal(resultText({ results: "Texto original" }), "Texto original");
  assert.deepEqual(resultIssues({ results: "Texto original" }), []);
});
test("draft supports incomplete fields, completion requires explicit result and valid objective", () => {
  assert.equal(projectResultSchema.safeParse(newProjectResult()).success, true);
  assert.deepEqual(resultIssues({ results: "", project_results: [] }), [
    "results",
  ]);
  const c = {
    results: "",
    project_results: [result],
    strategic_alignment: { objectives: [objective] },
  };
  assert.deepEqual(resultIssues(c), []);
  assert.deepEqual(
    resultIssues({ ...c, strategic_alignment: { objectives: [] } }),
    ["result_1"],
  );
  assert.deepEqual(
    resultIssues({ ...c, project_results: [{ ...result, target: null }] }),
    ["result_1"],
  );
  assert.deepEqual(
    resultIssues({ ...c, project_results: [{ ...result, target: 0 }] }),
    [],
  );
});
test("rejects invalid percentage, duplicate identifiers and missing custom units", () => {
  const c = { results: "", strategic_alignment: { objectives: [objective] } };
  for (const row of [
    { ...result, unit: "percent" as const, target: 101 },
    { ...result, unit: "other" as const, other_unit: "" },
  ])
    assert.deepEqual(resultIssues({ ...c, project_results: [row] }), [
      "result_1",
    ]);
  assert.deepEqual(resultIssues({ ...c, project_results: [result, result] }), [
    "result_2",
  ]);
  assert.equal(
    projectResultSchema.safeParse({ ...result, target: Infinity }).success,
    false,
  );
});
test("renders target, objective and evidence for document and internal views in both languages", () => {
  const c = {
    results: "",
    project_results: [result],
    strategic_alignment: { objectives: [objective] },
  };
  assert.match(resultText(c), /60 Personas/);
  assert.match(resultText(c), /OE1: Fortalecer capacidades locales/);
  assert.match(
    resultText(c, "en"),
    /Expected evidence: Asistencia y evaluación/,
  );
});

test("concept note requires only outcome and an existing specific objective; full proposal requires measurement", () => {
  const simple = {
    ...newProjectResult(),
    objective_id: objective.id,
    result: "Materiales y formación disponibles",
  };
  const c = {
    results: "",
    project_results: [simple],
    strategic_alignment: { objectives: [objective] },
  };
  const original = structuredClone(c);
  assert.deepEqual(resultIssues(c, 1), []);
  assert.deepEqual(resultIssues(c, 2), ["result_1"]);
  assert.deepEqual(
    resultIssues({ ...c, project_results: [{ ...simple, result: " " }] }, 1),
    ["result_1"],
  );
  assert.deepEqual(
    resultIssues(
      { ...c, project_results: [{ ...simple, objective_id: "missing" }] },
      1,
    ),
    ["result_1"],
  );
  assert.deepEqual(
    resultIssues(
      {
        ...c,
        strategic_alignment: {
          objectives: [{ ...objective, kind: "general" }],
        },
      },
      1,
    ),
    ["result_1"],
  );
  assert.deepEqual(
    resultIssues({ ...c, project_results: [simple, simple] }, 1),
    ["result_2"],
  );
  assert.deepEqual(
    resultIssues(
      {
        ...c,
        project_results: [simple, { ...simple, id: crypto.randomUUID() }],
      },
      1,
    ),
    [],
  );
  assert.deepEqual(c, original);
});

test("stage-aware completion, progress guidance and derived narrative do not require hidden fields", () => {
  const p = emptyPayload();
  p.concept.strategic_alignment = {
    version: "pg2030-ods-general-v3",
    objectives: [
      {
        id: crypto.randomUUID(),
        kind: "general",
        text: "Conservar",
        plan: ["E1"],
        ods: [14],
        glf: [],
      },
      { ...objective, kind: "specific", plan: [], ods: [], glf: [] },
    ],
  };
  p.concept.project_results = [
    {
      ...newProjectResult(),
      objective_id: objective.id,
      result: "Entregables previstos",
    },
  ];
  p.concept.results = resultText(p.concept, "es", 1);
  const rules = {
    categories: [],
    summary_word_limit: 500,
    max_admin_percent: 10,
  } as unknown as Rules;
  for (const stage of [1, 2]) {
    assert.equal(
      validateComplete(p, rules, stage).includes("result_1"),
      stage === 2,
    );
    assert.equal(
      stepIssues(p, rules, stage, 1).missing.includes("result_1"),
      stage === 2,
    );
    for (const locale of ["es", "en"] as const) {
      const missing = completionGuidance(p, rules, stage, [], locale).filter(
        (i) => i.id.startsWith("result-"),
      );
      assert.deepEqual(
        missing.map((i) => i.id),
        stage === 1
          ? []
          : [
              "result-0-indicator",
              "result-0-target",
              "result-0-unit",
              "result-0-evidence",
            ],
      );
      const text = resultText(p.concept, locale, 1);
      assert.ok(
        text.indexOf(objective.text) < text.indexOf("Entregables previstos"),
      );
      assert.doesNotMatch(
        text,
        /Indicador|Indicator|Meta|target|Evidencia|evidence/,
      );
    }
  }
});

test("stage-specific review/PDF preserve hidden historical details and frozen earlier layouts", () => {
  const c = emptyPayload().concept;
  c.strategic_alignment = {
    version: "pg2030-ods-general-v3",
    objectives: [
      { ...objective, kind: "specific", plan: [], ods: [], glf: [] },
    ],
  };
  c.project_results = [
    {
      ...result,
      indicator: "INDICATOR_HISTORIC",
      target: 101,
      unit: "percent",
      evidence: "EVIDENCE_HISTORIC",
    },
  ];
  c.results_source = "ORIGINAL_SOURCE";
  const original = structuredClone(c);
  assert.deepEqual(resultIssues(c, 1), []);
  assert.deepEqual(resultIssues(c, 2), ["result_1"]);
  for (const locale of ["es", "en"] as const) {
    for (const [stage, layoutVersion, detailed] of [
      [1, currentConceptLayout, false],
      [2, currentConceptLayout, true],
      [1, previousGlfConceptLayout, true],
      [1, null, true],
    ] as const) {
      const section = conceptSections(c, locale, undefined, {
        stage,
        layoutVersion,
      }).find((s) => s.id === "results")!;
      const table = section.blocks.find((b) => b.type === "table")!;
      assert.equal(
        table.type === "table" && table.headers.length,
        detailed ? 4 : 2,
      );
      assert.equal(
        JSON.stringify(section).includes("INDICATOR_HISTORIC"),
        detailed,
      );
      assert.equal(
        JSON.stringify(section).includes("EVIDENCE_HISTORIC"),
        detailed,
      );
      assert.ok(JSON.stringify(section).includes(result.result));
      if (stage === 2 && layoutVersion === currentConceptLayout)
        assert.ok(
          JSON.stringify(section).includes(
            locale === "es" ? "Meta propuesta" : "Proposed target",
          ),
        );
      if (layoutVersion === previousGlfConceptLayout)
        assert.ok(
          JSON.stringify(section).includes(
            locale === "es" ? "Meta preliminar" : "Preliminary target",
          ),
        );
    }
  }
  assert.deepEqual(c, original);
});
