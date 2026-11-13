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

import {
  parseReviewEvidence,
  selectedReferences,
  prepareApplicantObservation,
} from "../src/lib/rag-review";
test("selected evidence rejects foreign and duplicate references and preserves old records", () => {
  const evidence = {
    results: [
      {
        id: 17,
        document_name: "Manual GLF",
        document_version: "v1",
        locator: "página 2",
        content: "Definición normativa",
        similarity: 0.8,
      },
    ],
  };
  assert.ok(parseReviewEvidence("e5", evidence));
  assert.equal(
    parseReviewEvidence("e5", { ...evidence, selected_ids: ["18"] }),
    null,
  );
  assert.equal(
    parseReviewEvidence("e5", { ...evidence, selected_ids: ["17", "17"] }),
    null,
  );
  assert.equal(
    parseReviewEvidence("e5", {
      ...evidence,
      selected_ids: [],
      draft_kind: "applicant_observation",
    }),
    null,
  );
  const valid = {
    ...evidence,
    selected_ids: ["17"],
    draft_kind: "applicant_observation",
  };
  assert.ok(parseReviewEvidence("e5", valid));
  assert.equal(
    selectedReferences("e5", valid, ["17"], true)[0].text,
    "Definición normativa",
  );
  assert.deepEqual(selectedReferences("e5", valid, ["forged"], true), []);
});
test("observation drafts request clarification, retain selected references and respect phase boundaries", () => {
  const p = emptyPayload();
  const a = newActivity();
  a.title = "Instalación de fondeos";
  const r = newRisk();
  r.name = "Perturbación de fauna";
  a.risks = [r];
  p.activities = [a];
  const [risk] = projectRisks(p, "es");
  const refs = [
    {
      id: "17",
      name: "Manual GLF",
      locator: "página 2",
      text: "Definición normativa",
    },
  ];
  const phase1 = prepareApplicantObservation(risk, 1, refs, "", true);
  assert.match(phase1, /probabilidad y la gravedad/);
  assert.match(phase1, /Manual GLF/);
  assert.ok(!phase1.includes("PGAS"));
  assert.match(prepareApplicantObservation(risk, 2, refs, "", true), /PGAS/);
  assert.match(
    prepareApplicantObservation(risk, 1, refs, "Precise la duración.", true),
    /Precise la duración/,
  );
  assert.throws(() => prepareApplicantObservation(risk, 1, [], "", true));
  assert.ok(
    prepareApplicantObservation(risk, 1, refs, "", false).includes(
      "technical review",
    ),
  );
});

import { riskRetrievalQuery } from "../src/lib/rag-context";
test("focused search keeps risk terms separate from review question and bounds expansion", () => {
  const p = emptyPayload();
  const a = newActivity();
  a.title = "Programa educativo-artístico para la infancia";
  const r = newRisk();
  r.name =
    "Presión sobre áreas sensibles del manglar por tránsito durante actividades educativas";
  a.risks = [r];
  p.activities = [a];
  const [risk] = projectRisks(p, "es");
  const search = riskRetrievalQuery(risk);
  assert.match(search, /manglar/);
  assert.match(search, /biodiversidad conservación hábitats/);
  assert.ok(!search.includes("identificación y evaluación inicial"));
  assert.ok(!search.includes("nota conceptual"));
  assert.match(riskRetrievalQuery(risk, "exclusions"), /lista exclusión/);
  risk.description = "x".repeat(5000);
  assert.ok(riskRetrievalQuery(risk).length <= 600);
});
