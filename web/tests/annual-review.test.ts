import { test } from "node:test";
import assert from "node:assert/strict";
import {
  budgetSchema,
  budgetTotals,
  budgetYears,
  cents,
  remunerationCheck,
  adminCheck,
  type Budget,
} from "../src/lib/budget";
import {
  rubric,
  individualTotal,
  draftAverage,
  administrativeChecklist,
} from "../src/lib/evaluation-rubrics";
import { grantRanges, callThemes } from "../src/lib/grant-rules";
function budget(): Budget {
  return {
    version: "glf-annual-v1",
    currency: "USD",
    years: 2,
    lines: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        year: 1,
        category: "personnel",
        description: "Equipo",
        glf: 200000,
        other: 100000,
        remuneration: "yes",
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        year: 2,
        category: "equipment",
        description: "Equipos",
        glf: 800000,
        other: 50000,
        remuneration: "no",
      },
    ],
  };
}
test("annual budget uses integer cents, all funding sources and consistent categories/years", () => {
  assert.equal(cents("0.10")! + cents("0.20")!, 30);
  assert.equal(cents("1.001"), null);
  assert.equal(cents("-1"), null);
  assert.equal(cents("1e3"), null);
  assert.equal(cents("999999999999.99"), 99999999999999);
  const b = budget(),
    t = budgetTotals(b);
  assert.equal(t.glf, 1000000);
  assert.equal(t.other, 150000);
  assert.equal(t.categories.length, 7);
  assert.equal(
    t.years.reduce((s, y) => s + y.glf + y.other, 0),
    t.total,
  );
  assert.equal(remunerationCheck(b).amount, 300000);
  assert.equal(remunerationCheck(b).exceeds, false);
  b.lines[0].other++;
  assert.equal(remunerationCheck(b).exceeds, true);
  b.lines[1].remuneration = "pending";
  assert.equal(remunerationCheck(b).definitive, false);
  assert.equal(adminCheck(b, null), null);
  const administrative = budget();
  administrative.lines[0].category = "administration";
  administrative.lines[0].glf = 90000;
  administrative.lines[0].other = 1000;
  assert.equal(adminCheck(administrative, "glf")!.exceeds, true);
  assert.equal(adminCheck(administrative, "project")!.exceeds, false);
  assert.equal(
    budgetSchema.safeParse({ ...b, lines: [b.lines[0], b.lines[0]] }).success,
    false,
  );
  assert.equal(budgetSchema.safeParse({ ...b, years: 1 }).success, false);
});
test("budget follows maximum duration, including leap years without inventing mandatory terms", () => {
  assert.equal(budgetYears("2024-02-29", "2025-02-27"), 1);
  assert.equal(budgetYears("2024-02-29", "2025-02-28"), 2);
  assert.equal(budgetYears("2027-07-01", "2028-06-30"), 1);
  assert.equal(budgetYears("2027-07-01", "2028-07-01"), 2);
  assert.equal(budgetYears("2027-01-01", "2027-03-31"), 1);
  assert.equal(budgetYears("2027-01-01", "2029-12-31"), 3);
});
test("official ranges avoid overlap at 100000 and 250000; themes are explicitly configurable", () => {
  assert.equal(grantRanges.small.max, 100000);
  assert.equal(grantRanges.medium.min, 100000.01);
  assert.equal(grantRanges.medium.max, 250000);
  assert.equal(grantRanges.large.min, 250000.01);
  assert.equal(callThemes.length, 4);
});
test("rubrics are 50 and 55; unanswered never becomes zero; strictly less than 25 is distinct", () => {
  for (const stage of [1, 2]) {
    const all = Object.fromEntries(rubric(stage).map((c) => [c.id, 5]));
    assert.equal(individualTotal(stage, all).total, stage === 1 ? 50 : 55);
    assert.equal(individualTotal(stage, {}).total, null);
    assert.throws(() => individualTotal(stage, { "1.1": 0 }));
    assert.throws(() => individualTotal(stage, { "1.1": 6 }));
    assert.throws(() => individualTotal(stage, { fake: 3 }));
  }
  const scores = Object.fromEntries(
    rubric(1).map((c, i) => [c.id, i < 5 ? 2 : 3]),
  );
  assert.equal(draftAverage(1, [{ scores }]).mean, 25);
  assert.equal(draftAverage(1, [{ scores }]).below25, false);
  scores["1.1"] = 1;
  assert.equal(draftAverage(1, [{ scores }]).below25, true);
  assert.equal(draftAverage(1, [{ scores }, { scores: {} }]).pending, 1);
  assert.equal(draftAverage(1, [{ scores, abstained: true }]).mean, null);
  assert.equal(draftAverage(1, [{ scores }]).definitive, false);
  assert.equal(administrativeChecklist(1).length, 8);
  assert.equal(administrativeChecklist(2).length, 7);
});

test("custom call themes preserve unchecked options and validate bilingual names, identifiers and selections", async () => {
  const { callThemes } = await import("../src/lib/grant-rules");
  const { themeOptions, parseCallThemes, themeOptionsSchema } =
    await import("../src/lib/call-themes");
  const custom = {
    id: `custom_${crypto.randomUUID()}`,
    label_es: "Restauración de ecosistemas",
    label_en: "Ecosystem restoration",
  };
  const options = [...callThemes, custom];
  const stored = parseCallThemes(JSON.stringify(options), [custom.id]);
  assert.deepEqual(stored.themes, [custom]);
  assert.equal(themeOptions(stored).length, options.length);
  const unchecked = parseCallThemes(JSON.stringify(stored.theme_options), []);
  assert.equal(unchecked.themes.length, 0);
  assert.equal(unchecked.theme_options.at(-1)?.label_en, custom.label_en);
  assert.throws(() => parseCallThemes(JSON.stringify(options), ["unknown"]));
  assert.throws(() =>
    parseCallThemes(JSON.stringify(options), [custom.id, custom.id]),
  );
  for (const extra of [
    {
      ...custom,
      id: `custom_${crypto.randomUUID()}`,
      label_es: "  RESTAURACION   DE ECOSISTEMAS ",
    },
    {
      ...custom,
      id: `custom_${crypto.randomUUID()}`,
      label_es: "Otra línea",
      label_en: "ecosystem restoration",
    },
    { ...custom, label_en: " " },
    { ...custom, id: "forged" },
    { ...custom, label_es: "a".repeat(201) },
    { ...custom, label_es: "bad\nname" },
  ])
    assert.equal(
      themeOptionsSchema.safeParse([...options, extra]).success,
      false,
    );
  assert.equal(
    themeOptionsSchema.safeParse([{ ...callThemes[0], label_es: "Altered" }])
      .success,
    false,
  );
  assert.equal(
    themeOptionsSchema.safeParse(
      Array.from({ length: 51 }, (_, i) => ({
        id: `custom_${crypto.randomUUID()}`,
        label_es: `Tema ${i}`,
        label_en: `Theme ${i}`,
      })),
    ).success,
    false,
  );
});

test("custom theme identifiers display the frozen bilingual label and preserve historical free text", async () => {
  const { callThemeLabel } = await import("../src/lib/call-themes");
  const rules = {
    themes: [
      { id: "custom_1", label_es: "Restauración", label_en: "Restoration" },
    ],
  };
  assert.equal(callThemeLabel("custom_1", rules, "es"), "Restauración");
  assert.equal(callThemeLabel("custom_1", rules, "en"), "Restoration");
  assert.equal(
    callThemeLabel("Educación marina", rules, "es"),
    "Educación marina",
  );
  assert.equal(callThemeLabel("Histórico", null, "en"), "Histórico");
});

test("M07 application topics use only each frozen call catalogue, not the authoring options or labels", async () => {
  const { applicationTopicIssue } = await import("../src/lib/call-themes");
  const a = callThemes[0],
    b = callThemes[1];
  const first = { themes: [a], theme_options: [a, b] };
  const second = { themes: [b], theme_options: [a, b] };
  for (const [rules, allowed, foreign] of [
    [first, a, b],
    [second, b, a],
  ] as const) {
    assert.equal(applicationTopicIssue(allowed.id, rules), null);
    for (const value of [
      foreign.id,
      allowed.label_es,
      allowed.label_en,
      "legacy",
      "",
    ])
      assert.equal(
        applicationTopicIssue(value, rules),
        "GLF_INVALID_PROJECT_THEME",
      );
  }
  for (const rules of [{}, { themes: [] }, { themes: [], theme_options: [a] }])
    assert.equal(
      applicationTopicIssue(a.id, rules),
      "GLF_CALL_THEMES_REQUIRED",
    );
});

test("M07 incomplete and historical drafts remain parseable; completion and guidance block missing catalogues in both phases", async () => {
  const { emptyPayload, payloadSchema, validateComplete } =
    await import("../src/lib/domain");
  const { stepIssues } = await import("../src/lib/step-validation");
  const { completionGuidance } = await import("../src/lib/completion-guidance");
  const p = emptyPayload();
  p.concept.project_type = "Tema histórico sin reasignar";
  const original = structuredClone(p);
  const base = {
    categories: [],
    applicant_types: [],
    max_admin_percent: 10,
    summary_word_limit: 500,
    required_attachments: [],
    privacy_es: "",
    privacy_en: "",
  };
  for (const themes of [undefined, [], [callThemes[0]]]) {
    const rules = { ...base, themes };
    assert.ok(payloadSchema.safeParse(p).success);
    assert.ok(stepIssues(p, rules, 1, 0).invalid.includes("project_type"));
    for (const stage of [1, 2]) {
      assert.ok(validateComplete(p, rules, stage).includes("project_type"));
      for (const locale of ["es", "en"] as const) {
        const issue = completionGuidance(p, rules, stage, [], locale).find(
          (i) => i.id === "project_type",
        );
        assert.equal(issue?.step, 0);
        assert.equal(issue?.selector, '[data-validation-field="project_type"]');
        assert.match(
          issue!.text,
          themes?.length ? /catálogo|catalogue/ : /configurados|configured/,
        );
      }
    }
  }
  assert.deepEqual(p, original);
  p.concept.project_type = callThemes[0].id;
  assert.ok(
    !validateComplete(p, { ...base, themes: [callThemes[0]] }, 1).includes(
      "project_type",
    ),
  );
});

test("M07 ES/EN topic selector disables previous values and missing catalogues, with associated accessible help and no free text", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ApplicationTopicSelect } =
    await import("../src/components/application-topic-select");
  for (const locale of ["es", "en"] as const) {
    for (const themes of [undefined, [], [callThemes[0]], [callThemes[1]]]) {
      const before = JSON.stringify(themes);
      const html = renderToStaticMarkup(
        createElement(ApplicationTopicSelect, {
          locale,
          themes,
          value: "Tema anterior",
          invalid: false,
          onChange: () => assert.fail("render mutated data"),
        }),
      );
      assert.match(
        html,
        /<option value="Tema anterior" disabled="" selected="">/,
      );
      assert.match(html, /<option value="" disabled="">/);
      assert.match(html, /valor anterior|previous value/);
      assert.match(html, /aria-describedby="([^"]+)"/);
      const id = html.match(/aria-describedby="([^"]+)"/)![1];
      assert.ok(html.includes(`id="${id}"`));
      assert.ok(!html.includes("<input"));
      if (themes?.length) {
        assert.ok(!/<select[^>]*disabled/.test(html));
        assert.ok(html.includes(`value="${themes[0].id}"`));
        assert.ok(
          html.includes(
            locale === "es" ? themes[0].label_es : themes[0].label_en,
          ),
        );
        assert.ok(
          !html.includes(
            `value="${themes[0].id === callThemes[0].id ? callThemes[1].id : callThemes[0].id}"`,
          ),
        );
      } else assert.match(html, /<select[^>]*disabled=""/);
      assert.equal(JSON.stringify(themes), before);
    }
  }
});

test("attachment definitions require formats, bilingual names and coherent conditions while preserving legacy attachments", async () => {
  const {
    attachmentRequirementsSchema,
    attachmentDraftSchema,
    requiredAttachments,
    attachmentAccept,
    attachmentFormatAllowed,
    attachmentLabel,
  } = await import("../src/lib/attachment-requirements");
  const r = {
    id: "attachment_1",
    label_es: "Certificado",
    label_en: "Certificate",
    formats: ["pdf"],
    conditions: [],
    instructions_es: "",
    instructions_en: "",
  };
  assert.equal(attachmentRequirementsSchema.safeParse([r]).success, true);
  for (const bad of [
    { ...r, label_en: "" },
    { ...r, formats: [] },
    { ...r, conditions: ["other"] },
    { ...r, conditions: ["electronic_signature"], formats: ["jpg"] },
    { ...r, formats: ["exe"] },
    { ...r, formats: ["pdf", "pdf"] },
    { ...r, id: "agreement" },
    { ...r, instructions_es: "Sin traducción" },
  ])
    assert.equal(attachmentRequirementsSchema.safeParse([bad]).success, false);
  assert.equal(
    attachmentRequirementsSchema.safeParse([
      r,
      { ...r, id: "attachment_2", label_es: "CERTIFICADO" },
    ]).success,
    false,
  );
  assert.equal(
    attachmentDraftSchema.safeParse([{ ...r, label_es: "", label_en: "" }])
      .success,
    true,
  );
  const legacy = requiredAttachments({
    required_attachments: ["CV", "concept_signed"],
  });
  assert.equal(legacy[0].id, "CV");
  assert.ok(legacy[0].formats.includes("docx"));
  assert.deepEqual(legacy[1].formats, ["pdf"]);
  assert.deepEqual(legacy[1].conditions, ["electronic_signature"]);
  assert.equal(
    attachmentAccept({ ...legacy[0], formats: ["jpg", "png"] }),
    ".jpg,.jpeg,.png",
  );
  assert.equal(
    attachmentFormatAllowed({ ...legacy[0], formats: ["jpg"] }, "jpeg"),
    true,
  );
  assert.equal(
    attachmentLabel(
      {
        required_attachments: ["attachment_1"],
        attachment_requirements: [r as (typeof legacy)[number]],
      },
      "attachment_1",
      "en",
    ),
    "Certificate",
  );
  const optional = {
    required_attachments: [],
    attachment_requirements: [r as (typeof legacy)[number]],
  };
  assert.equal(attachmentLabel(optional, "attachment_1", "es"), "Certificado");
  assert.equal(
    attachmentLabel(optional, "concept_signed", "es"),
    "Nota conceptual firmada electrónicamente",
  );
  assert.equal(
    attachmentLabel(optional, "matrix_signed", "en"),
    "Electronically signed environmental and social assessment",
  );
  assert.equal(attachmentLabel(optional, "other", "es"), "Otro anexo");
  assert.equal(attachmentLabel(optional, "agreement", "en"), "Agreement");
  assert.equal(
    attachmentLabel(optional, "Certificado histórico", "es"),
    "Certificado histórico",
  );
  assert.equal(requiredAttachments(optional).length, 0);
});

test("required uploads enforce format and embedded signatures, recheck the latest file, and preserve manual notarization review", async () => {
  const { validateRequiredFile, validateRequiredDocuments } =
    await import("../src/lib/attachment-validation");
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = await pdf.save();
  const r = {
    id: "attachment_1",
    label_es: "Documento",
    label_en: "Document",
    formats: ["pdf"] as ("pdf" | "jpg")[],
    conditions: [] as ("electronic_signature" | "notarized")[],
    instructions_es: "",
    instructions_en: "",
  };
  assert.equal(await validateRequiredFile(r, "document.pdf", bytes), null);
  assert.equal(
    await validateRequiredFile(
      { ...r, formats: ["jpg"] },
      "document.pdf",
      bytes,
    ),
    "GLF_ATTACHMENT_FORMAT",
  );
  assert.equal(
    await validateRequiredFile(
      { ...r, conditions: ["electronic_signature"] },
      "document.pdf",
      bytes,
    ),
    "GLF_SIGNATURE_MISSING",
  );
  assert.equal(
    await validateRequiredFile(
      { ...r, conditions: ["notarized"] },
      "document.pdf",
      bytes,
    ),
    null,
    "notarization authenticity remains a human review",
  );
  assert.equal(
    await validateRequiredDocuments([r], [], async () => bytes),
    "GLF_ATTACHMENT_REQUIRED",
  );
  assert.equal(
    await validateRequiredDocuments(
      [r],
      [
        { kind: r.id, file_name: "wrong.jpg", storage_path: "new" },
        { kind: r.id, file_name: "document.pdf", storage_path: "old" },
      ],
      async () => bytes,
    ),
    "GLF_ATTACHMENT_UNREADABLE",
  );
  assert.equal(
    await validateRequiredDocuments(
      [r],
      [{ kind: r.id, file_name: "document.pdf", storage_path: "x" }],
      async () => {
        throw new Error("unavailable");
      },
    ),
    "GLF_ATTACHMENT_UNREADABLE",
  );
});
