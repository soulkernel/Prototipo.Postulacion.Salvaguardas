import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyPayload, newActivity, newRisk } from "../src/lib/domain";
import { projectRisks, riskQuery } from "../src/lib/rag-context";
test("RAG context preserves distinct activity risks and never includes project identity", () => {
  const payload = emptyPayload();
  payload.concept.contact_name = "PRIVATE_NAME";
  const a = newActivity();
  a.title = "Coastal restoration";
  const r = newRisk();
  r.name = "Habitat disturbance";
  r.probability = 3;
  r.severity = 4;
  a.risks = [r];
  payload.activities = [a];
  const [context] = projectRisks(payload, "es");
  assert.equal(context.score, 12);
  assert.equal(context.level, "high");
  assert.equal(context.id, r.id);
  assert.equal(riskQuery(context, 1, "qwen").includes("PGAS"), false);
  assert.match(riskQuery(context, 2, "qwen"), /PGAS/);
  assert.equal(riskQuery(context, 1, "e5").includes("PRIVATE_NAME"), false);
  context.description = "x".repeat(5000);
  assert.ok(riskQuery(context, 1, "qwen").length <= 600);
  assert.ok(riskQuery(context, 1, "e5").length <= 1500);
});

test("risk questions deduplicate descriptions and separate exclusions from screening", () => {
  const p = emptyPayload();
  const a = newActivity();
  a.title = "Instalación de fondeos";
  const r = newRisk();
  r.name = "Perturbación de fauna marina";
  r.description = r.name + ".";
  a.risks = [r];
  p.activities = [a];
  const [risk] = projectRisks(p, "es");
  const q = riskQuery(risk, 1, "qwen");
  assert.equal(q.split(r.name).length - 1, 1);
  assert.ok(!q.includes("exclusiones"));
  assert.ok(!q.includes("PGAS"));
  assert.match(riskQuery(risk, 1, "qwen", "exclusions"), /exclusiones/);
});

import {
  evidenceSourceName,
  evidenceLocation,
} from "../src/lib/evidence-presentation";
test("reading labels preserve source identity without inventing pages", () => {
  assert.equal(
    evidenceSourceName("CREF-03_ES_20210614-ifc-ps-guidance-note-1-es"),
    "IFC · Nota de orientación 1",
  );
  assert.equal(
    evidenceLocation("SOURCE::0002 / part 5 / chars 2800-3600", true),
    "Fragmento 2 · segmento 5",
  );
  assert.equal(
    evidenceLocation("SOURCE::0012 / page markers 39", true),
    "Referencia de página: 39",
  );
  assert.equal(evidenceLocation("custom locator", true), "custom locator");
});
