import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  emptyPayload,
  newActivity,
  payloadSchema,
  validateComplete,
  financialErrors,
  type Rules,
  type Concept,
} from "../src/lib/domain";
import { identityFieldsForStage } from "../src/lib/fields";
import { stepIssues } from "../src/lib/step-validation";
import { completionGuidance } from "../src/lib/completion-guidance";
import { submissionProgress } from "../src/lib/submission-progress";
import { financialFeedback } from "../src/lib/financial-feedback";
import { conceptSections } from "../src/lib/concept-presentation";
import { currentConceptLayout } from "../src/lib/concept-layout";
import { ConceptReview } from "../src/components/concept-review";
import { summaryWorkbook } from "../src/lib/backup-workbook";
import { unzipSync, strFromU8 } from "fflate";
import { manualChapters } from "../src/lib/applicant-manual";
import { newProjectResult, resultText } from "../src/lib/project-results";
import {
  currentAlignmentVersion,
  newObjective,
} from "../src/lib/strategic-alignment";

const rules: Rules = {
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
  applicant_types: ["organization"],
  themes: [{ id: "research", label_es: "Investigación", label_en: "Research" }],
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
      Object.assign(p.concept, { [key]: "Información de prueba" });
  Object.assign(p.concept, {
    title: "M08 aislado",
    applicant_type: "organization",
    ruc: "2090000000001",
    partners: "",
    project_type: "research",
    category_id: "small",
    province: "Galápagos",
    city: "Puerto Ayora",
    project_islands: ["Santa Cruz"],
    other_islands: "",
    phone: "+593991234567",
    email: "qa@example.test",
    requested_amount: 10000,
    cofinance_amount: 2000,
    admin_cost: null,
    start_date: "2027-01-01",
    end_date: "2027-06-30",
  });
  const activity = newActivity();
  Object.assign(activity, {
    title: "Revisión documental",
    description: "Revisión de información disponible",
    no_risks_reason:
      "Se realiza únicamente revisión documental sin intervención de campo.",
  });
  p.activities = [activity];
  p.consent = true;
  p.truthful = true;
  return p;
}

test("concept note reaches 100% with objective and outcome only, without silently requiring phase-two measurements", () => {
  const p = complete(),
    general = {
      ...newObjective("general", currentAlignmentVersion),
      text: "Conservar",
      plan: ["E1"],
      ods: [14],
    },
    specific = {
      ...newObjective("specific", currentAlignmentVersion),
      text: "Fortalecer capacidades",
    };
  p.concept.strategic_alignment = {
    version: currentAlignmentVersion,
    objectives: [general, specific],
  };
  p.activities[0].objective_ids = [specific.id];
  p.concept.project_results = [
    {
      ...newProjectResult(),
      objective_id: specific.id,
      result: "Capacidades fortalecidas y materiales disponibles",
    },
  ];
  p.concept.results = resultText(p.concept, "es", 1);
  assert.deepEqual(validateComplete(p, rules, 1), []);
  assert.deepEqual(stepIssues(p, rules, 1, 1), { missing: [], invalid: [] });
  for (const locale of ["es", "en"] as const)
    assert.deepEqual(completionGuidance(p, rules, 1, [], locale), []);
  assert.equal(
    submissionProgress(
      p,
      rules,
      1,
      [],
      [{ kind: "concept_signed" }, { kind: "matrix_signed" }],
      true,
      true,
    ).percent,
    100,
  );
  assert.ok(validateComplete(p, rules, 2).includes("result_1"));
});

test("M15 complete v3 reaches 100% without a contribution field and keeps beneficiaries required", () => {
  const p = complete();
  const general = {
    ...newObjective("general", currentAlignmentVersion),
    text: "Conservar hábitats",
    plan: ["E1"],
    ods: [14],
  };
  const specific = {
    ...newObjective("specific", currentAlignmentVersion),
    text: "Restaurar hábitats",
  };
  p.concept.strategic_alignment = {
    version: currentAlignmentVersion,
    objectives: [general, specific],
  };
  p.activities[0].objective_ids = [specific.id];
  assert.equal(payloadSchema.safeParse(p).success, true);
  assert.ok(
    !manualChapters
      .flatMap((chapter) => chapter.rows)
      .some((row) => row[0] === "Contribución o beneficio esperado"),
  );
  assert.ok(
    !manualChapters
      .flatMap((chapter) => chapter.screen)
      .some((row) => row[0] === "Contribución o beneficio esperado *"),
  );
  assert.deepEqual(validateComplete(p, rules, 1), []);
  assert.deepEqual(stepIssues(p, rules, 1, 1), { missing: [], invalid: [] });
  for (const locale of ["es", "en"] as const)
    assert.deepEqual(completionGuidance(p, rules, 1, [], locale), []);
  assert.equal(
    submissionProgress(
      p,
      rules,
      1,
      [],
      [{ kind: "concept_signed" }, { kind: "matrix_signed" }],
      true,
      true,
    ).percent,
    100,
  );
  Object.assign(general, { contribution: "APORTE_HISTORICO_M15" });
  assert.deepEqual(validateComplete(p, rules, 1), []);
  assert.equal(
    payloadSchema.parse(p).concept.strategic_alignment!.objectives[0]
      .contribution,
    "APORTE_HISTORICO_M15",
  );
  p.concept.beneficiaries = "";
  assert.ok(validateComplete(p, rules, 1).includes("beneficiaries"));
});

test("M08 new concept without admin_cost can be parsed and completed at 100%, with no hidden mandatory field", () => {
  const raw = complete();
  delete (raw.concept as Partial<Concept>).admin_cost;
  const original = structuredClone(raw);
  const p = payloadSchema.parse(raw);
  assert.equal(p.concept.admin_cost, null);
  assert.deepEqual(validateComplete(p, rules, 1), []);
  assert.deepEqual(stepIssues(p, rules, 1, 0), { missing: [], invalid: [] });
  for (const locale of ["es", "en"] as const)
    assert.deepEqual(completionGuidance(p, rules, 1, [], locale), []);
  const docs = [{ kind: "concept_signed" }, { kind: "matrix_signed" }];
  assert.equal(
    submissionProgress(p, rules, 1, [], docs, true, true).percent,
    100,
  );
  assert.ok(!identityFieldsForStage(1).some((f) => f.key === "admin_cost"));
  assert.deepEqual(raw, original);
  const financing = manualChapters.find(
    (chapter) => chapter.id === "presupuesto",
  )!;
  assert.match(financing.steps[0][0], /no se solicita un importe separado/);
  assert.match(financing.steps[0][1], /not requested in the concept note/);
  assert.ok(
    !manualChapters
      .flatMap((chapter) => chapter.rows)
      .some((row) => row[0] === "Gastos administrativos (USD)"),
  );
});

test("M08 historical amount is preserved, ignored in phase one and controlled again in phase two without changing the percentage base", () => {
  const p = complete();
  p.concept.admin_cost = 50000;
  const original = structuredClone(p);
  assert.deepEqual(validateComplete(p, rules, 1), []);
  assert.deepEqual(financialErrors(p.concept, rules, 1), {});
  for (const locale of ["es", "en"] as const) {
    assert.deepEqual(
      financialFeedback(
        p.concept,
        rules,
        locale,
        { admin_cost: true },
        null,
        true,
        1,
      ).admin_cost,
      { invalid: false, text: "" },
    );
    assert.ok(
      !completionGuidance(p, rules, 1, [], locale).some(
        (i) => i.id === "admin_cost",
      ),
    );
  }
  assert.ok(validateComplete(p, rules, 2).includes("admin_cost"));
  assert.ok(stepIssues(p, rules, 2, 0).invalid.includes("admin_cost"));
  assert.deepEqual(p, original);
  p.concept.admin_cost = null;
  assert.ok(stepIssues(p, rules, 2, 0).missing.includes("admin_cost"));
  assert.ok(validateComplete(p, rules, 2).includes("admin_cost"));
  assert.ok(identityFieldsForStage(2).some((f) => f.key === "admin_cost"));
  // Preserve the current cost-total base: do not resolve the institutional conflict.
  p.concept.admin_cost = 1100;
  assert.equal(financialErrors(p.concept, rules, 2).admin_cost, undefined);
  p.concept.admin_cost = 1200;
  assert.equal(financialErrors(p.concept, rules, 2).admin_cost, undefined);
  p.concept.admin_cost = 1200.01;
  assert.equal(financialErrors(p.concept, rules, 2).admin_cost, "ADMIN_LIMIT");
});

test("M08 review and presentation omit admin only in the new phase-one layout and preserve legacy and phase-two views in ES/EN", () => {
  const c = complete().concept;
  c.admin_cost = 987.65;
  const original = structuredClone(c);
  for (const locale of ["es", "en"] as const) {
    const label =
      locale === "es" ? "Gastos administrativos" : "Administrative expenses";
    for (const [stage, layoutVersion, expected] of [
      [1, currentConceptLayout, false],
      [1, null, true],
      [2, currentConceptLayout, true],
      [2, null, true],
    ] as const) {
      const presentation = { stage, layoutVersion };
      const sections = conceptSections(c, locale, rules, presentation);
      const text = JSON.stringify(sections);
      assert.equal(text.includes(label), expected);
      const html = renderToStaticMarkup(
        createElement(ConceptReview, {
          concept: c,
          locale,
          rules,
          presentation,
        }),
      );
      assert.equal(html.includes(label), expected);
    }
    assert.ok(
      !JSON.stringify(conceptSections(c, locale, rules)).includes(label),
    );
  }
  assert.deepEqual(c, original);
});

test("M08 archival Excel preserves historical admin values, keeps absent amounts unrecorded and never invents zero", () => {
  const applications = [
    {
      id: "old",
      reference_code: "M08-OLD",
      call_id: "call",
      stage: 1,
      status: "submitted",
    },
    {
      id: "new",
      reference_code: "M08-NEW",
      call_id: "call",
      stage: 1,
      status: "submitted",
    },
  ];
  const versions = [
    {
      application_id: "old",
      revision: 1,
      stage: 1,
      concept_layout_version: null,
      payload: { concept: { ...complete().concept, admin_cost: 987.65 } },
    },
    {
      application_id: "new",
      revision: 1,
      stage: 1,
      concept_layout_version: currentConceptLayout,
      payload: { concept: { ...complete().concept, admin_cost: null } },
    },
  ];
  const records = { applications, application_versions: versions };
  const original = structuredClone(records);
  for (const locale of ["es", "en"] as const) {
    const zip = unzipSync(summaryWorkbook(records, locale));
    const xml = strFromU8(zip["xl/worksheets/sheet1.xml"]);
    const rows = Array.from(xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)).map(
      (m) => m[1],
    );
    assert.equal(rows.length, 3);
    const headers = Array.from(
      rows[0].matchAll(/<c\b[^>]*>([\s\S]*?)<\/c>/g),
    ).map((m) => m[1]);
    const index = headers.findIndex((v) =>
      v.includes(
        locale === "es" ? "Gastos administrativos" : "Administrative costs",
      ),
    );
    assert.ok(index >= 0);
    const old = Array.from(rows[1].matchAll(/<c\b[^>]*>([\s\S]*?)<\/c>/g)).map(
      (m) => m[1],
    );
    const fresh = Array.from(
      rows[2].matchAll(/<c\b[^>]*>([\s\S]*?)<\/c>/g),
    ).map((m) => m[1]);
    assert.match(old[index], /<v>987.65<\/v>/);
    assert.match(
      fresh[index],
      locale === "es" ? /No registrado/ : /Not recorded/,
    );
  }
  assert.deepEqual(records, original);
});
