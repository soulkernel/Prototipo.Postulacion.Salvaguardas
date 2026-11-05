import { test } from "node:test";
import assert from "node:assert/strict";
import { completionGuidance } from "../src/lib/completion-guidance";
import {
  emptyPayload,
  newActivity,
  newRisk,
  type Rules,
} from "../src/lib/domain";
const rules = {
  categories: [],
  max_admin_percent: 10,
  summary_word_limit: 500,
} as unknown as Rules;
test("points to individual risk fields and removes corrected items without altering the payload", () => {
  const p = emptyPayload();
  const a = newActivity();
  a.title = "Actividad";
  a.description = "Descripción";
  const r = newRisk();
  r.name = "Riesgo";
  r.description = "Impacto";
  r.probability = 2;
  a.risks = [r];
  p.activities = [a];
  const original = JSON.stringify(p);
  const issues = completionGuidance(p, rules, 1, [], "es");
  const issue = issues.find((i) => i.id === "risk-0-0-severity");
  assert.ok(issue);
  assert.equal(issue.step, 3);
  assert.match(issue.selector, /1-1/);
  assert.match(issue.text, /gravedad/);
  assert.ok(!issues.some((i) => i.id === "risk-0-0-probability"));
  assert.equal(JSON.stringify(p), original);
  r.severity = 3;
  assert.ok(
    !completionGuidance(p, rules, 1, [], "es").some(
      (i) => i.id === "risk-0-0-severity",
    ),
  );
});
test("separates declarations and phase two requirements", () => {
  const p = emptyPayload();
  const a = newActivity();
  a.title = "Activity";
  a.description = "Description";
  const r = newRisk();
  r.name = "Risk";
  r.description = "Impact";
  r.probability = 2;
  r.severity = 3;
  a.risks = [r];
  p.activities = [a];
  const first = completionGuidance(p, rules, 1, [], "en");
  assert.equal(first.filter((i) => i.step === 5).length, 2);
  assert.ok(!first.some((i) => i.id.includes("residual_probability")));
  const second = completionGuidance(p, rules, 2, [], "en");
  assert.ok(second.some((i) => i.id === "risk-0-0-residual_probability"));
  p.consent = true;
  p.truthful = true;
  assert.equal(
    completionGuidance(p, rules, 1, [], "en").filter((i) => i.step === 5)
      .length,
    0,
  );
});
