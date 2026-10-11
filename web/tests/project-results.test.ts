import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newProjectResult,
  resultIssues,
  resultText,
  projectResultSchema,
} from "../src/lib/project-results";
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
