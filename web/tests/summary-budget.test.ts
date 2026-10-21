import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { emptyPayload, newActivity, payloadSchema } from "../src/lib/domain";
import {
  summaryBudgetSchema,
  summaryBudgetIssues,
  summaryBudgetTotals,
  summaryBudgetMessage,
} from "../src/lib/summary-budget";
import { stepIssues } from "../src/lib/step-validation";
import type { Rules } from "../src/lib/domain";
import { conceptSections } from "../src/lib/concept-presentation";
import {
  currentConceptLayout,
  orderedConceptLayout,
} from "../src/lib/concept-layout";
import { SummaryBudgetFields } from "../src/components/summary-budget-fields";
import {
  applicationStepFromQuery,
  applicationStepUrl,
} from "../src/lib/application-navigation";
const defaultRules: Rules = {
  categories: [],
  applicant_types: [],
  themes: [],
  max_admin_percent: 10,
  summary_word_limit: 500,
  required_attachments: [],
  privacy_es: "",
  privacy_en: "",
};

function fixture() {
  const p = emptyPayload();
  p.activities = [
    { ...newActivity(), title: "Actividad ficticia A" },
    { ...newActivity(), title: "Actividad ficticia B" },
  ];
  Object.assign(p.concept, {
    requested_amount: 10000,
    cofinance_amount: 2000,
    admin_cost: 9999,
  });
  p.concept.summary_budget = {
    version: "glf-summary-v1",
    currency: "USD",
    entries: [
      {
        activity_id: p.activities[0].id,
        goods: 500000,
        services: 100000,
        consultancies: 200000,
        fees: 200000,
      },
      {
        activity_id: p.activities[1].id,
        goods: 100000,
        services: 0,
        consultancies: 100000,
        fees: 0,
      },
    ],
    administrative: 120000,
    other_remuneration: 100000,
    sgas: 50000,
  };
  return p;
}
test("summary matches the two general amounts to cents and component identification never adds costs twice", () => {
  const p = fixture();
  assert.equal(summaryBudgetTotals(p.concept.summary_budget).total, 1200000);
  assert.deepEqual(summaryBudgetIssues(p), []);
  p.concept.requested_amount = 10000.01;
  assert.ok(summaryBudgetIssues(p).includes("summary_budget_totals"));
  p.concept.summary_budget!.entries[1].goods!++;
  assert.deepEqual(summaryBudgetIssues(p), []);
  assert.equal(p.concept.admin_cost, 9999); // Historical amount remains independent.
});
test("administration uses total project cost, remuneration uses GLF and exact boundaries pass", () => {
  const p = fixture(),
    b = p.concept.summary_budget!;
  assert.deepEqual(summaryBudgetIssues(p), []);
  b.administrative = 120001;
  assert.ok(summaryBudgetIssues(p).includes("summary_budget_admin_limit"));
  b.administrative = 120000;
  b.other_remuneration = 100001;
  assert.ok(
    summaryBudgetIssues(p).includes("summary_budget_remuneration_limit"),
  );
  b.other_remuneration = 100000;
  b.sgas = 1200001;
  assert.ok(summaryBudgetIssues(p).includes("summary_budget_sgas_subset"));
  b.sgas = 0;
  assert.deepEqual(summaryBudgetIssues(p), []);
  b.other_remuneration = 1000001;
  assert.ok(
    summaryBudgetIssues(p).includes("summary_budget_remuneration_subset"),
  );
});
test("incomplete and excessive estimates save structurally while malformed amounts, duplicate links and overflow are rejected", () => {
  const p = fixture(),
    b = p.concept.summary_budget!;
  b.entries[0].goods = null;
  b.administrative = 999999;
  b.sgas = null;
  assert.equal(payloadSchema.safeParse(p).success, true);
  assert.ok(
    summaryBudgetIssues(p).some((k) =>
      k.startsWith("summary_budget_activity_"),
    ),
  );
  for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER, Infinity, NaN, "10"]) {
    const bad = structuredClone(b);
    (bad.entries[0] as unknown as { goods: unknown }).goods = value;
    assert.equal(summaryBudgetSchema.safeParse(bad).success, false);
  }
  const duplicate = structuredClone(b);
  duplicate.entries.push(duplicate.entries[0]);
  assert.equal(summaryBudgetSchema.safeParse(duplicate).success, false);
  const zero = fixture();
  Object.assign(zero.concept.summary_budget!.entries[1], {
    goods: 0,
    services: 0,
    consultancies: 0,
    fees: 0,
  });
  zero.concept.requested_amount = 8000;
  zero.concept.cofinance_amount = 2000;
  zero.concept.summary_budget!.administrative = 100000;
  zero.concept.summary_budget!.other_remuneration = 40000;
  assert.deepEqual(summaryBudgetIssues(zero), []);
});
test("rename, reorder and added/deleted activities keep identifiers, preserve money and expose missing or orphan costs", () => {
  const p = fixture(),
    before = structuredClone(p.concept.summary_budget);
  p.activities.reverse();
  p.activities[0].title = "Nombre nuevo";
  assert.deepEqual(summaryBudgetIssues(p), []);
  assert.deepEqual(p.concept.summary_budget, before);
  const added = newActivity();
  p.activities.push(added);
  assert.ok(
    summaryBudgetIssues(p).includes("summary_budget_activity_" + added.id),
  );
  p.activities.pop();
  p.activities.pop();
  assert.ok(summaryBudgetIssues(p).includes("summary_budget_unlinked"));
  assert.equal(summaryBudgetTotals(p.concept.summary_budget).total, 1200000);
});
test("summary validation belongs to step 3 in phase one and does not reconcile historical estimates against phase-two annual edits", () => {
  const p = fixture();
  delete p.concept.summary_budget;
  assert.ok(
    stepIssues(p, defaultRules, 1, 2).invalid.includes("summary_budget"),
  );
  assert.ok(
    !stepIssues(p, defaultRules, 1, 0).invalid.includes("summary_budget"),
  );
  assert.deepEqual(stepIssues(p, defaultRules, 2, 2), {
    missing: [],
    invalid: [],
  });
});
test("current review/PDF sections include a single summary with included amounts; frozen v6 does not reinterpret it", () => {
  const p = fixture(),
    before = structuredClone(p);
  for (const locale of ["es", "en"] as const) {
    const sections = conceptSections(
      p.concept,
      locale,
      undefined,
      { stage: 1, layoutVersion: currentConceptLayout },
      p.activities,
    );
    const section = sections.find((s) => s.id === "summary_budget")!;
    assert.ok(section);
    assert.equal(section.blocks[0].type, "table");
    if (section.blocks[0].type === "table") {
      assert.equal(section.blocks[0].headers.length, 7);
      assert.equal(section.blocks[0].rows.length, 3);
      assert.ok(section.blocks[0].rows[0][0].includes(p.activities[0].title));
    }
    assert.equal(
      conceptSections(
        p.concept,
        locale,
        undefined,
        { stage: 1, layoutVersion: orderedConceptLayout },
        p.activities,
      ).some((s) => s.id === "summary_budget"),
      false,
    );
    const html = renderToStaticMarkup(
      createElement(SummaryBudgetFields, {
        payload: p,
        locale,
        onChange: () => {},
        onValidity: () => {},
        editGeneral: () => {},
        editActivities: () => {},
      }),
    );
    assert.match(html, /id="summary-budget"/);
    assert.match(html, /role="status"/);
    assert.match(html, /aria-describedby/);
    assert.match(
      html,
      locale === "es" ? /Presupuesto resumido/ : /Summary budget/,
    );
    for (const code of [
      "summary_budget_totals",
      "summary_budget_admin_limit",
      "summary_budget_remuneration_limit",
    ])
      assert.ok(summaryBudgetMessage(code, locale).length > 20);
  }
  assert.deepEqual(p, before);
});
test("six steps use stable keys and old risk/review URLs preserve their original section", () => {
  for (let i = 0; i < 6; i++) {
    const url = new URL(
      applicationStepUrl("https://qa.invalid/applicant/id?receipt=qa#main", i),
      "https://qa.invalid",
    );
    assert.equal(
      applicationStepFromQuery(
        url.searchParams.get("step"),
        url.searchParams.get("section"),
      ),
      i,
    );
    assert.equal(url.searchParams.get("receipt"), "qa");
  }
  assert.equal(applicationStepFromQuery("3"), 3);
  assert.equal(applicationStepFromQuery("4"), 5);
  assert.equal(applicationStepFromQuery("3", "budget"), 2);
});
