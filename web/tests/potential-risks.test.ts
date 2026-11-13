import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyPayload,
  newActivity,
  newRisk,
  payloadSchema,
} from "../src/lib/domain";
import {
  riskCode,
  synchronizeRisks,
  potentialRiskIssues,
} from "../src/lib/potential-risks";
test("registered risk identity survives use in multiple activities with independent scores", () => {
  const p = emptyPayload();
  const id = crypto.randomUUID();
  p.concept.risk_register = [
    { id, dimension: "environmental", name: "Daño al hábitat" },
  ];
  p.activities = [newActivity(), newActivity()];
  p.activities.forEach(
    (a, i) =>
      (a.risks = [
        {
          ...newRisk(),
          source_id: id,
          name: "Daño al hábitat",
          dimension: "environmental",
          probability: i + 1,
          severity: 3,
        },
      ]),
  );
  assert.equal(riskCode(p.concept.risk_register, id), "RA-1");
  assert.equal(payloadSchema.safeParse(p).success, true);
  assert.deepEqual(potentialRiskIssues(p), []);
  p.concept.risk_register[0].name = "Alteración del hábitat";
  const updated = synchronizeRisks(p);
  assert.equal(updated.activities[1].risks[0].name, "Alteración del hábitat");
  assert.equal(updated.activities[1].risks[0].probability, 2);
  assert.match(updated.concept.environmental_risks, /RA-1/);
});
test("forged, duplicate and unlinked risk references cannot be completed", () => {
  const p = emptyPayload();
  const id = crypto.randomUUID();
  p.concept.risk_register = [{ id, dimension: "social", name: "Conflicto" }];
  assert.ok(potentialRiskIssues(p).includes("risk_unlinked"));
  p.activities = [newActivity()];
  p.activities[0].risks = [{ ...newRisk(), source_id: crypto.randomUUID() }];
  assert.equal(payloadSchema.safeParse(p).success, false);
  p.activities[0].risks = [
    { ...newRisk(), source_id: id, name: "Conflicto", dimension: "social" },
  ];
  p.activities[0].risks.push({
    ...p.activities[0].risks[0],
    id: crypto.randomUUID(),
  });
  assert.equal(payloadSchema.safeParse(p).success, false);
});
