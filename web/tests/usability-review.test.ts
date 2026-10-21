import { test } from "node:test";
import assert from "node:assert/strict";
import { submissionProgress } from "../src/lib/submission-progress";
import { uploadSelectionError } from "../src/lib/upload-selection";
import {
  emptyPayload,
  newActivity,
  newRisk,
  validateComplete,
  type Rules,
} from "../src/lib/domain";
const rules: Rules = {
  themes: [{ id: "research", label_es: "Investigación", label_en: "Research" }],
  categories: [
    {
      id: "small",
      label_es: "Pequeña",
      label_en: "Small",
      min_amount: 0,
      max_amount: 100000,
      max_months: 12,
      cofinance_percent: 0,
    },
  ],
  applicant_types: ["ngo"],
  max_admin_percent: 10,
  summary_word_limit: 500,
  required_attachments: [],
  privacy_es: "",
  privacy_en: "",
};
function complete() {
  const p = emptyPayload();
  for (const [key, value] of Object.entries(p.concept))
    if (typeof value === "string")
      Object.assign(p.concept, { [key]: "Texto completo" });
  Object.assign(p.concept, {
    partners: "",
    applicant_type: "ngo",
    project_type: "research",
    category_id: "small",
    requested_amount: 10000,
    cofinance_amount: 0,
    admin_cost: 100,
    phone: "+593991234567",
    email: "example@example.org",
    province: "Galápagos",
    city: "Puerto Ayora",
    project_islands: ["Santa Cruz"],
    start_date: "2026-11-01",
    end_date: "2027-10-31",
  });
  const a = newActivity();
  a.title = "Educación";
  a.description = "Recorridos";
  const r = newRisk();
  Object.assign(r, {
    name: "Residuos",
    description: "Residuos en recorridos",
    probability: 2,
    severity: 2,
  });
  a.risks = [r];
  p.activities = [a];
  const objective = crypto.randomUUID();
  p.concept.strategic_alignment = {version:"pg2030-ods-general-v3",objectives:[
    {id:crypto.randomUUID(),kind:"general",text:"Propósito ficticio",plan:["E1"],ods:[14],glf:[]},
    {id:objective,kind:"specific",text:"Objetivo ficticio",plan:[],ods:[],glf:[]}
  ]};
  a.objective_ids = [objective];
  p.concept.monitoring_plan = [{id:crypto.randomUUID(),parameter:"activity",reference_id:a.id,indicator:"Avance ficticio",strategy:"Revisar registros"}];
  p.consent = true;
  p.truthful = true;
  return p;
}
test("progress requires all content, current signed files, declarations; saving is independent; never mutates the payload", () => {
  const p = complete();
  const before = JSON.stringify(p);
  const docs = [{ kind: "concept_signed" }, { kind: "matrix_signed" }];
  assert.equal(
    submissionProgress(p, rules, 1, [], docs, true, true).percent,
    100,
  );
  assert.ok(
    submissionProgress(p, rules, 1, [], docs, false, true).percent < 100,
  );
  assert.ok(
    submissionProgress(p, rules, 1, [], docs, true, false).percent === 100,
  );
  assert.ok(submissionProgress(p, rules, 1, [], [], true, true).percent < 100);
  assert.equal(JSON.stringify(p), before);
  p.truthful = false;
  assert.ok(
    submissionProgress(p, rules, 1, [], docs, true, true).percent < 100,
  );
  p.truthful = true;
  p.concept.email = "invalid";
  assert.ok(
    submissionProgress(p, rules, 1, [], docs, true, true).percent < 100,
  );
});
test("phase two requirements and optional documents affect progress only when required", () => {
  const p = complete();
  const fields = [
    {
      id: "schedule",
      label_es: "Cronograma",
      label_en: "Schedule",
      type: "text" as const,
      required: true,
    },
  ];
  assert.ok(
    submissionProgress(p, rules, 2, fields, [], true, true).percent < 100,
  );
  assert.ok(
    submissionProgress(emptyPayload(), rules, 1, [], [], false, true).percent <
      100,
  );
});
test("file selection refuses multiple, empty, oversize and disallowed files", () => {
  const file = { name: "document.PDF", size: 200 };
  assert.equal(uploadSelectionError([file], ".pdf,application/pdf"), null);
  assert.equal(uploadSelectionError([file, file], ".pdf"), "single");
  assert.equal(uploadSelectionError([{ ...file, size: 0 }], ".pdf"), "size");
  assert.equal(
    uploadSelectionError([{ ...file, size: 4 * 1024 * 1024 + 1 }], ".pdf"),
    "size",
  );
  assert.equal(
    uploadSelectionError([{ ...file, name: "bad.exe" }], ".pdf"),
    "format",
  );
});

test("progress counts a single summary, reads legacy parts and excludes future phase requirements", () => {
  const p = complete();
  p.concept.summary_parts = {
    context: "Contexto",
    problem: "Problema",
    threats: "Amenazas",
    rationale: "Justificación",
    solution: "Solución",
    results: "Resultados",
  };
  p.concept.summary = "";
  const docs = [{ kind: "concept_signed" }, { kind: "matrix_signed" }];
  const fields = [
    {
      id: "future",
      label_es: "Futuro",
      label_en: "Future",
      type: "text" as const,
      required: true,
    },
  ];
  assert.equal(
    submissionProgress(p, rules, 1, fields, docs, true, false).percent,
    100,
  );
  p.concept.summary_parts.problem = "";
  assert.equal(
    submissionProgress(p, rules, 1, fields, docs, true, true).percent,
    100,
  );
  assert.ok(!validateComplete(p, rules, 1).includes("summary"));
  for (const key of Object.keys(p.concept.summary_parts))
    p.concept.summary_parts[key as keyof typeof p.concept.summary_parts] = "";
  assert.ok(
    submissionProgress(p, rules, 1, fields, docs, true, true).percent < 100,
  );
  assert.ok(validateComplete(p, rules, 1).includes("summary"));
  p.concept.summary = "palabra ".repeat(500);
  assert.equal(
    submissionProgress(p, rules, 1, fields, docs, true, true).percent,
    100,
  );
  assert.ok(!validateComplete(p, rules, 1).includes("summary_word_limit"));
  p.concept.summary += "adicional";
  assert.ok(validateComplete(p, rules, 1).includes("summary_word_limit"));
  assert.ok(
    submissionProgress(p, rules, 1, fields, docs, true, true).percent < 100,
  );
});
