import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyPayload, type Rules, validateComplete } from "../src/lib/domain";
import {
  identificationIssue,
  identificationIssues,
  maxProjectEnd,
  projectDateErrors,
} from "../src/lib/applicant-validation";
import { stepIssues } from "../src/lib/step-validation";
import { financialFeedback, moneyFields } from "../src/lib/financial-feedback";
import { grantRanges } from "../src/lib/grant-rules";
import { financialErrors } from "../src/lib/domain";
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
test("money warnings wait for blur or an attempt, while required values and category limits remain enforced", () => {
  const r = {
    ...rules,
    categories: Object.entries(grantRanges).map(([id, x]) => ({
      id,
      min_amount: x.min,
      max_amount: x.max,
      max_months: 36,
      cofinance_percent: id === "small" ? 0 : id === "medium" ? 10 : 25,
    })),
  } as Rules;
  const c = { ...emptyPayload().concept, category_id: "large" };
  assert.ok(moneyFields.every((k) => c[k] === null));
  let feedback = financialFeedback(c, r, "es", {}, null, false);
  assert.ok(moneyFields.every((k) => !feedback[k].invalid));
  assert.match(feedback.cofinance_amount.text, /25%/);
  assert.match(feedback.admin_cost.text, /10%/);
  assert.ok(!feedback.admin_cost.text.includes("0,00"));
  feedback = financialFeedback(c, r, "es", {}, null, true);
  assert.ok(moneyFields.every((k) => feedback[k].invalid));
  assert.match(feedback.requested_amount.text, /Complete este campo/);
  Object.assign(c, {
    requested_amount: 250000,
    cofinance_amount: 0,
    admin_cost: 0,
  });
  assert.equal(financialErrors(c, r).requested_amount, "CATEGORY_AMOUNT");
  assert.equal(
    financialFeedback(c, r, "es", {}, null, false).requested_amount.invalid,
    false,
  );
  assert.equal(
    financialFeedback(c, r, "es", { requested_amount: true }, null, false)
      .requested_amount.invalid,
    true,
  );
  assert.equal(
    financialFeedback(
      c,
      r,
      "es",
      { requested_amount: true },
      "requested_amount",
      true,
    ).requested_amount.invalid,
    true,
  );
  Object.assign(c, { requested_amount: 250000.01, cofinance_amount: 62500.01 });
  assert.deepEqual(financialErrors(c, r), {});
  assert.equal(
    financialFeedback(c, r, "en", {}, null, true).cofinance_amount.invalid,
    false,
  );
  c.category_id = "medium";
  c.requested_amount = 250000;
  assert.deepEqual(financialErrors(c, r), {});
  c.category_id = "small";
  c.requested_amount = 100000;
  c.cofinance_amount = 0;
  assert.equal(
    financialFeedback(c, r, "es", {}, null, true).cofinance_amount.invalid,
    false,
  );
  c.requested_amount = 0;
  assert.equal(
    financialFeedback(c, r, "es", {}, null, true).requested_amount.invalid,
    true,
  );
});
test("concept estimates ignore dormant annual lines while full projects reconcile them", () => {
  const p = emptyPayload();
  Object.assign(p.concept, {
    category_id: "large",
    requested_amount: 320000,
    cofinance_amount: 80000,
    admin_cost: 15000,
    start_date: "2027-01-02",
    end_date: "2028-12-30",
  });
  p.budget = {
    version: "glf-annual-v1",
    currency: "USD",
    years: 3,
    lines: [
      {
        id: crypto.randomUUID(),
        year: 1,
        category: "personnel",
        description: "",
        glf: 0,
        other: 0,
        remuneration: "pending",
      },
    ],
  };
  for (const key of ["budget_totals", "budget_description", "budget_year"]) {
    assert.ok(!validateComplete(p, rules, 1).includes(key));
    assert.ok(!stepIssues(p, rules, 1, 0).invalid.includes(key));
    assert.ok(validateComplete(p, rules, 2).includes(key));
    assert.ok(stepIssues(p, rules, 2, 0).invalid.includes(key));
  }
  assert.equal(p.concept.requested_amount, 320000);
  assert.equal(p.concept.cofinance_amount, 80000);
  assert.equal(p.concept.admin_cost, 15000);
});
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
  assert.deepEqual(identificationIssues(c), [
    "residence_number",
    "identity_number",
  ]);
  assert.equal(identificationIssue(c), "residence_number");
  c.residence_number = "RP-123456";
  assert.equal(identificationIssue(c), "identity_number");
  assert.deepEqual(identificationIssues(c), ["identity_number"]);
  c.identity_number = "0123456789";
  assert.equal(identificationIssue(c), undefined);
  for (const invalid of ["", "123456789", "01234ABCDE", "01234 6789"]) {
    c.identity_number = invalid;
    assert.equal(identificationIssue(c), "identity_number");
  }
  c.identity_number = "0123456789";
  assert.ok(
    !validateComplete({ ...emptyPayload(), concept: c }, rules, 1).includes(
      "identity_number",
    ),
  );
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
