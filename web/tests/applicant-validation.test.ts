import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyPayload, type Rules, validateComplete } from "../src/lib/domain";
import {
  identificationIssue,
  maxProjectEnd,
  projectDateErrors,
} from "../src/lib/applicant-validation";
import { stepIssues } from "../src/lib/step-validation";
import {
  alignmentVersion,
  legacyAlignmentVersion,
  newObjective,
  strategicSchema,
  strategicText,
  alignmentIssues,
  type StrategicAlignment,
} from "../src/lib/strategic-alignment";
const rules = {
  categories: [12, 24, 36].map((m, i) => ({
    id: ["small", "medium", "large"][i],
    min_amount: 0,
    max_amount: null,
    max_months: m,
    cofinance_percent: 0,
  })),
  max_admin_percent: 10,
  summary_word_limit: 500,
} as Rules;
test("calendar duration validates inclusive limits for each category, leap years and month ends", () => {
  assert.equal(maxProjectEnd("2024-02-29", 12), "2025-02-27");
  assert.equal(maxProjectEnd("2026-01-31", 1), "2026-02-27");
  assert.equal(maxProjectEnd("2026-02-30", 12), undefined);
  for (const [id, years] of [
    ["small", 1],
    ["medium", 2],
    ["large", 3],
  ] as const) {
    const c = {
      ...emptyPayload().concept,
      category_id: id,
      start_date: "2026-10-14",
      end_date: `${2026 + years}-10-13`,
    };
    assert.deepEqual(projectDateErrors(c, rules), {});
    c.end_date = `${2026 + years}-10-14`;
    assert.equal(projectDateErrors(c, rules).end_date, "CATEGORY_DURATION");
    const p = { ...emptyPayload(), concept: c };
    assert.ok(stepIssues(p, rules, 1, 0).invalid.includes("end_date"));
    assert.ok(validateComplete(p, rules, 1).includes("end_date"));
  }
  const c = {
    ...emptyPayload().concept,
    start_date: "2026-10-14",
    end_date: "2026-10-14",
  };
  assert.equal(projectDateErrors(c, rules).end_date, "INVALID_DATES");
});
test("identification is conditional and incomplete drafts remain schema-compatible", () => {
  const c = emptyPayload().concept;
  c.applicant_type = "individual";
  assert.equal(identificationIssue(c), "residence_number");
  c.residence_number = "RP-123456";
  assert.equal(identificationIssue(c), undefined);
  c.applicant_type = "organization";
  assert.equal(identificationIssue(c), "ruc");
  c.ruc = "2090000000001";
  assert.equal(identificationIssue(c), undefined);
  c.ruc = "209000000000X";
  assert.equal(identificationIssue(c), "ruc");
});
test("legacy alignment retains historical text and v2 only includes general objective alignment", () => {
  const general = {
    ...newObjective("general"),
    text: "Conservar ecosistemas",
    plan: ["E1"],
    ods: [14],
    glf: ["GLF-L01"],
    contribution: "Conservar el hábitat",
  };
  const specific = {
    ...newObjective("specific"),
    text: "Restaurar manglar",
    plan: ["E1"],
    ods: [14],
    glf: ["GLF-L01"],
    contribution: "Restaurar dos hectáreas",
  };
  const legacy: StrategicAlignment = {
    version: legacyAlignmentVersion,
    objectives: [general, specific],
  };
  assert.equal(strategicSchema.safeParse(legacy).success, true);
  assert.match(
    strategicText(legacy).alignment,
    /Prioridades estratégicas del GLF/,
  );
  const current: StrategicAlignment = {
    version: alignmentVersion,
    objectives: [
      { ...general, glf: [] },
      { ...specific, plan: [], ods: [], glf: [], contribution: "" },
    ],
  };
  assert.equal(strategicSchema.safeParse(current).success, true);
  assert.deepEqual(alignmentIssues(current), []);
  assert.doesNotMatch(
    strategicText(current).alignment,
    /GLF|Restaurar manglar/,
  );
});
