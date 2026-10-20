import { test } from "node:test";
import assert from "node:assert/strict";
import {
  privacyNotice,
  submissionConfirmation,
  submissionPhase,
} from "../src/lib/applicant-copy";
test("applicant submission history uses Galapagos date and the submitted version title", () => {
  const text = submissionConfirmation(
    1,
    "Proyecto presentado",
    "2026-10-11T05:37:10Z",
    "es",
  );
  assert.match(text, /Proyecto presentado/);
  assert.match(text, /sábado, 10 de octubre de 2026/);
  assert.match(text, /23:37:10/);
  assert.match(submissionPhase(2, "es"), /Presentación de propuesta completa/);
  assert.match(
    submissionConfirmation(2, "Archived title", "2026-10-11T17:37:10Z", "en"),
    /full proposal.*Archived title.*11:37:10/,
  );
  assert.equal(
    privacyNotice("Aviso institucional vigente", "es"),
    "Aviso institucional vigente",
  );
  assert.doesNotMatch(
    privacyNotice(
      "Prueba interna sin validez oficial. Utilice datos ficticios.",
      "es",
    ),
    /prueba|ficticios/i,
  );
});
import { submissionError } from "../src/lib/submission-error";
test("submission failures preserve actionable validation and hide internal SQL details", () => {
  assert.equal(
    submissionError(
      "function public.submit_application_core(uuid, integer) does not exist",
    ),
    "GLF_SUBMISSION_UNAVAILABLE",
  );
  assert.equal(submissionError("GLF_VERSION_CONFLICT"), "GLF_VERSION_CONFLICT");
  assert.equal(
    submissionError("GLF_ATTACHMENT_REQUIRED:concept_signed"),
    "GLF_ATTACHMENT_REQUIRED:concept_signed",
  );
});
import {
  safeReturnPath,
  riskLevel,
  riskScore,
  emptyPayload,
  payloadSchema,
  financialErrors,
  applicantDefaults,
  type Rules,
} from "../src/lib/domain";
import { csvCell, validateFile } from "../src/lib/files";
import { normalizePhone } from "../src/lib/phone";
import {
  grantCategoryAllowed,
  individualGrantIssue,
  validateComplete,
} from "../src/lib/domain";
import { stepIssues } from "../src/lib/step-validation";
import { financialFeedback } from "../src/lib/financial-feedback";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GrantCategorySelect } from "../src/components/grant-category-select";

test("M01 individual small-only rule preserves selections and amounts across type changes and reopened drafts", () => {
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
      {
        id: "medium",
        label_es: "Mediana",
        label_en: "Medium",
        min_amount: 100000.01,
        max_amount: 250000,
        max_months: 24,
        cofinance_percent: 10,
      },
      {
        id: "large",
        label_es: "Grande",
        label_en: "Large",
        min_amount: 250000.01,
        max_amount: null,
        max_months: 36,
        cofinance_percent: 25,
      },
    ],
    applicant_types: ["individual", "organization"],
    summary_word_limit: 500,
    max_admin_percent: 10,
    required_attachments: [],
    privacy_es: "",
    privacy_en: "",
  };
  for (const [category, amount] of [
    ["small", 100000],
    ["medium", 150000],
    ["large", 350000],
  ] as const) {
    const p = emptyPayload();
    Object.assign(p.concept, {
      applicant_type: "organization",
      category_id: category,
      requested_amount: amount,
      cofinance_amount: amount * 0.25,
      admin_cost: 0,
    });
    assert.equal(
      grantCategoryAllowed(p.concept.applicant_type, category),
      true,
    );
    assert.equal(individualGrantIssue(p.concept), null);
    const original = structuredClone(p);
    p.concept.applicant_type = "individual";
    const expected = category === "small" ? null : "category_id";
    assert.equal(individualGrantIssue(p.concept), expected);
    assert.equal(
      stepIssues(p, rules, 1, 0).invalid.includes("category_id"),
      category !== "small",
    );
    assert.equal(
      validateComplete(p, rules, 1).includes("category_id"),
      category !== "small",
    );
    const markup = renderToStaticMarkup(
      createElement(GrantCategorySelect, {
        applicantType: p.concept.applicant_type,
        value: category,
        rules,
        locale: "es",
        onChange: () => {},
      }),
    );
    for (const id of ["small", "medium", "large"]) {
      const option =
        markup.match(new RegExp(`<option[^>]*value="${id}"[^>]*>`))?.[0] ?? "";
      assert.ok(option);
      assert.equal(option.includes('disabled=""'), id !== "small");
      assert.equal(option.includes('selected=""'), id === category);
    }
    const reopened = JSON.parse(JSON.stringify(p));
    assert.equal(individualGrantIssue(reopened.concept), expected);
    assert.equal(reopened.concept.category_id, category);
    assert.equal(reopened.concept.requested_amount, amount);
    p.concept.applicant_type = "organization";
    assert.equal(individualGrantIssue(p.concept), null);
    assert.deepEqual(p, original);
    assert.doesNotMatch(
      renderToStaticMarkup(
        createElement(GrantCategorySelect, {
          applicantType: "organization",
          value: category,
          rules,
          locale: "en",
          onChange: () => {},
        }),
      ),
      /disabled=/,
    );
  }
  const p = emptyPayload();
  Object.assign(p.concept, {
    applicant_type: "individual",
    category_id: "small",
    requested_amount: 100000.01,
  });
  const permissive = {
    ...rules,
    categories: [{ ...rules.categories[0], max_amount: 250000 }],
  };
  assert.equal(
    financialErrors(p.concept, permissive).requested_amount,
    "INDIVIDUAL_SMALL_ONLY",
  );
  assert.match(
    financialFeedback(p.concept, permissive, "en", {}, null, true)
      .requested_amount.text,
    /100,000/,
  );
  const restricted = {
    ...rules,
    categories: [{ ...rules.categories[0], max_amount: 50000 }],
  };
  p.concept.requested_amount = 50001;
  assert.equal(
    financialErrors(p.concept, restricted).requested_amount,
    "CATEGORY_AMOUNT",
  );
  assert.equal(
    renderToStaticMarkup(
      createElement(GrantCategorySelect, {
        applicantType: "individual",
        value: "",
        rules: { ...rules, categories: [rules.categories[1]] },
        locale: "es",
        onChange: () => {},
      }),
    ).includes('value="small"'),
    false,
  );
});
import { riskLevelLabel } from "../src/lib/fields";
test("risk presentation translates all score bands without changing thresholds", () => {
  for (const [score, es, en] of [
    [null, "Sin completar", "Incomplete"],
    [4, "Bajo", "Low"],
    [9, "Medio", "Medium"],
    [15, "Alto", "High"],
    [25, "Muy alto", "Very high"],
  ] as const) {
    assert.equal(riskLevelLabel(score, "es"), es);
    assert.equal(riskLevelLabel(score, "en"), en);
  }
});
import { geographyIssues } from "../src/lib/geography";
import {
  applicantTypeAddressPatch,
  provinceAddressPatch,
  organizationProvinceIssue,
  provinces,
  cities,
} from "../src/lib/geography";
import { GeographyFields } from "../src/components/geography-fields";
test("M03 restricts organization province, preserves compatible locality and never rewrites prior input", () => {
  const base = {
    ...emptyPayload().concept,
    applicant_type: "individual",
    province: "Pichincha",
    city: "Quito",
    title: "Título conservado",
    applicant_name: "Nombre conservado",
    contact_name: "Contacto conservado",
  };
  const original = structuredClone(base);
  const org = { ...base, ...applicantTypeAddressPatch(base, "organization") };
  assert.equal(org.province, "Galápagos");
  assert.equal(org.city, "");
  assert.deepEqual(base, original);
  for (const field of [
    "title",
    "applicant_name",
    "contact_name",
    "address",
    "email",
    "ruc",
  ] as const)
    assert.equal(org[field], base[field]);
  const compatible = {
    ...base,
    province: "Galápagos",
    city: "Puerto Villamil",
  };
  assert.equal(
    applicantTypeAddressPatch(compatible, "organization").city,
    "Puerto Villamil",
  );
  assert.equal(
    applicantTypeAddressPatch(
      { ...compatible, city: "Localidad rural de Galápagos" },
      "organization",
    ).city,
    "Localidad rural de Galápagos",
  );
  const back = {
    ...org,
    city: "Puerto Ayora",
    ...applicantTypeAddressPatch(
      { ...org, city: "Puerto Ayora" },
      "individual",
    ),
  };
  assert.equal(back.province, "Galápagos");
  assert.equal(back.city, "Puerto Ayora");
  for (const province of provinces) {
    const c = {
      ...base,
      province,
      city: cities[province][0],
      project_islands: ["Santa Cruz"],
    };
    assert.equal(geographyIssues(c).includes("province"), false);
    assert.equal(geographyIssues(c).includes("city"), false);
  }
  assert.equal(
    geographyIssues({ ...org, province: "Guayas", city: "Guayaquil" }).includes(
      "province",
    ),
    true,
  );
  assert.equal(
    geographyIssues({ ...org, city: "Quito" }).includes("city"),
    true,
  );
  assert.equal(
    geographyIssues({ ...org, city: "Puerto Ayora" }).includes("city"),
    false,
  );
  assert.equal(provinceAddressPatch(base, "Guayas").city, "");
  assert.equal(
    provinceAddressPatch({ ...base, city: "Guayaquil" }, "Guayas").city,
    "Guayaquil",
  );
  const markup = renderToStaticMarkup(
    createElement(GeographyFields, {
      concept: org,
      locale: "es",
      mode: "address",
      onChange: () => {},
    }),
  );
  const provinceSelect =
    markup.match(
      /<select[^>]*data-validation-field="province"[\s\S]*?<\/select>/,
    )?.[0] || "";
  assert.match(provinceSelect, /disabled=""/);
  assert.match(provinceSelect, /selected="">Galápagos/);
  assert.doesNotMatch(provinceSelect, /Pichincha|Guayas/);
  assert.match(markup, /Las organizaciones deben tener domicilio en Galápagos\./);
  assert.match(renderToStaticMarkup(createElement(GeographyFields, { concept: org, locale: "en", mode: "address", onChange: () => {} })), /Organizations must be based in Galápagos\./);
  const citySelect =
    markup.match(
      /<select[^>]*data-validation-field="city"[\s\S]*?<\/select>/,
    )?.[0] || "";
  assert.doesNotMatch(citySelect, /disabled=""/);
  assert.match(citySelect, /Puerto Ayora/);
  assert.doesNotMatch(citySelect, />Quito</);
  const legacy = { ...base, applicant_type: "organization" };
  const before = structuredClone(legacy);
  assert.match(
    renderToStaticMarkup(
      createElement(GeographyFields, {
        concept: legacy,
        locale: "es",
        mode: "address",
        onChange: () => {},
      }),
    ),
    /valor anterior, requiere corrección/,
  );
  assert.deepEqual(legacy, before);
  assert.equal(organizationProvinceIssue(legacy), true);
  const defaults = applicantDefaults(legacy, "fallback@example.test", [
    "organization",
    "individual",
  ]);
  assert.equal(defaults.province, "Galápagos");
  assert.equal(defaults.city, "");
  assert.equal(defaults.applicant_name, legacy.applicant_name);
  assert.deepEqual(legacy, before);
});
import { emptySummary, projectSummary } from "../src/lib/summary";
import {
  sessionCookieOptions,
  rememberSeconds,
} from "../src/lib/session-preference";
test("staff invitation inputs reject invalid emails, applicant roles and incompatible delegation", () => {
  const input = {
    email: "STAFF@GLF.ORG.EC",
    full_name: " Staff Test ",
    role: "project_coordinator",
    scope: "none",
  };
  const parsed = invitationInput.parse(input);
  assert.equal(parsed.email, "staff@glf.org.ec");
  assert.equal(parsed.full_name, "Staff Test");
  for (const patch of [
    { email: "not-an-email" },
    { full_name: "X" },
    { full_name: "Test\nName" },
    { role: "applicant" },
    { scope: "projects" },
  ])
    assert.equal(
      invitationInput.safeParse({ ...input, ...patch }).success,
      false,
    );
  assert.deepEqual(invitationRoles("grants_manager", "projects"), [
    "project_coordinator",
  ]);
  assert.deepEqual(
    invitationRoles("sustainability_reviewer", "sustainability"),
    ["sustainability_reviewer"],
  );
  assert.deepEqual(invitationRoles("applicant", "projects"), []);
  assert.deepEqual(invitationRoles("grants_manager", "none"), []);
  assert.ok(!invitationRoles("administrator", "none").includes("applicant"));
});
test("remembered sessions preserve a fixed 90-day deadline and cookie deletion", () => {
  const now = 1700000000000;
  const options = { path: "/", maxAge: 400 * 86400, sameSite: "lax" as const };
  const preference = String(now + rememberSeconds * 1000);
  assert.equal(
    sessionCookieOptions(options, preference, now).maxAge,
    rememberSeconds,
  );
  assert.equal(
    sessionCookieOptions(options, preference, now + 86400000).maxAge,
    rememberSeconds - 86400,
  );
  assert.equal(
    sessionCookieOptions(options, preference, now + rememberSeconds * 1000)
      .maxAge,
    0,
  );
  assert.equal(sessionCookieOptions(options, "session", now).maxAge, undefined);
  assert.equal(
    sessionCookieOptions({ ...options, maxAge: 0 }, preference, now).maxAge,
    0,
  );
  assert.equal(sessionCookieOptions(options, "invalid", now).maxAge, undefined);
});
test("legacy summary parts merge in order and share the unified word limit", () => {
  const p = emptyPayload();
  p.concept.summary_parts = {
    ...emptySummary,
    context: "word ".repeat(495),
    problem: "one",
    threats: "two",
    rationale: "three",
    solution: "four",
    results: "five",
  };
  p.concept.summary = "Old scalar copy must not duplicate the six parts.";
  assert.equal(
    projectSummary(p.concept),
    "word ".repeat(495).trim() + "\n\none\n\ntwo\n\nthree\n\nfour\n\nfive",
  );
  const rules = { summary_word_limit: 500 } as Rules;
  assert.deepEqual(stepIssues(p, rules, 1, 1).invalid, []);
  p.concept.summary_parts.context += "another";
  assert.ok(stepIssues(p, rules, 1, 1).invalid.includes("summary"));
  p.concept.summary_parts.problem = "";
  assert.ok(
    !stepIssues(p, rules, 1, 1).missing.some((key) =>
      key.startsWith("summary"),
    ),
  );
  assert.deepEqual(stepIssues(p, rules, 1, 1).invalid, []);
});

test("one project summary is required and counted without six subsection requirements", () => {
  const p = emptyPayload();
  const rules = { summary_word_limit: 500 } as Rules;
  assert.ok(stepIssues(p, rules, 1, 1).missing.includes("summary"));
  p.concept.summary = "palabra ".repeat(500);
  assert.ok(!stepIssues(p, rules, 1, 1).missing.includes("summary"));
  assert.ok(!stepIssues(p, rules, 1, 1).invalid.includes("summary"));
  p.concept.summary += "adicional";
  assert.ok(stepIssues(p, rules, 1, 1).invalid.includes("summary"));
  assert.equal(
    payloadSchema.safeParse(p).success,
    true,
    "Over-limit content can still be saved as a draft",
  );
});
test("geography requires address location and consistent project islands", () => {
  assert.deepEqual(
    geographyIssues({
      province: "Galápagos",
      city: "Puerto Ayora",
      project_islands: ["Santa Cruz", "Isabela"],
      other_islands: "",
    }),
    [],
  );
  assert.ok(
    geographyIssues({
      province: "Pichincha",
      city: "Quito",
      project_islands: ["Todo Galápagos", "Santa Cruz"],
    }).includes("project_islands"),
  );
  assert.ok(
    geographyIssues({
      province: "Guayas",
      city: "Guayaquil",
      project_islands: ["Otras islas"],
    }).includes("other_islands"),
  );
  assert.deepEqual(
    geographyIssues({
      province: "Pichincha",
      city: "Otra ciudad",
      project_islands: ["Todo Galápagos"],
    }),
    [],
  );
});
test("continue reports missing required fields and financial errors together", () => {
  const rules = {
    themes: [
      { id: "research", label_es: "Investigación", label_en: "Research" },
    ],
    categories: [
      { id: "small", min_amount: 0, max_amount: 100000, cofinance_percent: 0 },
    ],
    max_admin_percent: 10,
    summary_word_limit: 500,
  } as Rules;
  const p = emptyPayload();
  Object.assign(p.concept, {
    project_type: "research",
    category_id: "small",
    requested_amount: 120000,
    cofinance_amount: 12000,
    admin_cost: 50000,
  });
  const both = stepIssues(p, rules, 1, 0);
  assert.ok(both.missing.includes("title"));
  assert.ok(both.missing.includes("contact_name"));
  assert.ok(!both.missing.includes("partners"));
  assert.deepEqual(both.invalid, ["requested_amount"]);
  assert.ok(stepIssues(p, rules, 2, 0).invalid.includes("admin_cost"));
  p.concept.requested_amount = 100000;
  p.concept.admin_cost = 1000;
  assert.deepEqual(stepIssues(p, rules, 1, 0).invalid, []);
  assert.ok(stepIssues(p, rules, 1, 1).missing.includes("summary"));
  assert.deepEqual(stepIssues(p, rules, 1, 2).missing, ["activities"]);
});
test("new applications reuse editable applicant details without copying project data", () => {
  const original = {
    ...emptyPayload().concept,
    applicant_type: "organization",
    applicant_name: "Example NGO",
    contact_name: "Example Contact",
    email: "contact@example.org",
    phone: "+593991234567",
    address: "Example address",
    province: "Galápagos",
    city: "Puerto Ayora",
    title: "Previous project",
    requested_amount: 100000,
  };
  const result = applicantDefaults(original, "account@example.org", [
    "organization",
    "individual",
  ]);
  assert.deepEqual(result, {
    applicant_type: "organization",
    applicant_name: "Example NGO",
    contact_name: "Example Contact",
    email: "contact@example.org",
    phone: "+593991234567",
    address: "Example address",
    province: "Galápagos",
    city: "Puerto Ayora",
  });
  result.applicant_name = "Another organization";
  assert.equal(original.applicant_name, "Example NGO");
  assert.deepEqual(applicantDefaults(undefined, "account@example.org", []), {
    email: "account@example.org",
  });
  assert.equal(
    applicantDefaults(original, "account@example.org", ["individual"])
      .applicant_type,
    undefined,
  );
});
test("financial limits reject excess amounts and accept exact boundaries", () => {
  const rules = {
    categories: [
      { id: "small", min_amount: 0, max_amount: 100000, cofinance_percent: 0 },
    ],
    max_admin_percent: 10,
  } as Rules;
  const c = {
    ...emptyPayload().concept,
    category_id: "small",
    requested_amount: 120000,
    cofinance_amount: 12000,
    admin_cost: 50000,
  };
  assert.equal(financialErrors(c, rules).requested_amount, "CATEGORY_AMOUNT");
  assert.equal(financialErrors(c, rules).admin_cost, "ADMIN_LIMIT");
  c.requested_amount = 100000;
  c.admin_cost = 11200;
  assert.deepEqual(financialErrors(c, rules), {});
  c.admin_cost = 11200.01;
  assert.equal(financialErrors(c, rules).admin_cost, "ADMIN_LIMIT");
  rules.categories[0].cofinance_percent = 10;
  c.cofinance_amount = 9999;
  assert.equal(financialErrors(c, rules).cofinance_amount, "COFINANCE");
});
test("contact phones validate country lengths and normalize mobile and landline numbers", () => {
  assert.equal(normalizePhone("0991234567", "EC"), "+593991234567");
  assert.equal(normalizePhone("052526000", "EC"), "+59352526000");
  assert.equal(normalizePhone("2025550123", "US"), "+12025550123");
  assert.equal(normalizePhone("+593991234567"), "+593991234567");
  for (const invalid of [
    "123",
    "099123456789999999999",
    "hello 0991234567",
    "+000991234567",
    "",
  ])
    assert.equal(normalizePhone(invalid), null);
});

test("authentication redirects cannot leave the application", () => {
  for (const value of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/internal\nfoo",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeReturnPath(value), "/applicant");
  }
  assert.equal(
    safeReturnPath("/documents/version/concept?lang=en"),
    "/documents/version/concept?lang=en",
  );
});
test("risk scale boundaries and missing data stay distinct", () => {
  assert.equal(riskScore(null, 5), null);
  assert.equal(riskLevel(null), "incomplete");
  for (const [value, band] of [
    [1, "low"],
    [4, "low"],
    [5, "medium"],
    [9, "medium"],
    [10, "high"],
    [15, "high"],
    [16, "very_high"],
    [25, "very_high"],
  ] as const)
    assert.equal(riskLevel(value), band);
});
test("draft schema rejects hidden fields and non-finite money", () => {
  assert.equal(payloadSchema.safeParse(emptyPayload()).success, true);
  assert.equal(
    payloadSchema.safeParse({ ...emptyPayload(), role: "administrator" })
      .success,
    false,
  );
  const payload = emptyPayload();
  payload.concept.requested_amount = Infinity;
  assert.equal(payloadSchema.safeParse(payload).success, false);
});
test("CSV neutralizes spreadsheet formulas and quotes", () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("@SUM(1)"), '"\'@SUM(1)"');
});
test("files require matching signatures and safe names", () => {
  const pdf = new TextEncoder().encode("%PDF-1.7 test");
  assert.equal(validateFile("example.pdf", pdf)?.mime, "application/pdf");
  assert.equal(validateFile("example.png", pdf), null);
  assert.equal(validateFile("../example.pdf", pdf), null);
  assert.equal(validateFile("example.exe", pdf), null);
});
import { invitationInput, invitationRoles } from "../src/lib/staff-invitations";
import { suggestCallCodes } from "../src/lib/call-codes";
test("call codes keep official and test sequences independent and use the Galapagos year", () => {
  const now = Date.parse("2026-10-07T12:00:00Z");
  assert.deepEqual(suggestCallCodes([], now), {
    official: "GLF-2026-001",
    test: "GLF-PRUEBA-2026-001",
  });
  assert.deepEqual(
    suggestCallCodes(
      [
        "GLF-2026-001",
        "glf-2026-004",
        "GLF-PRUEBA-2026-017",
        "GLF-2025-999",
        "QA-VISTA-PREVIA-20261007",
        "GLF-2026-NOTA",
      ],
      now,
    ),
    { official: "GLF-2026-005", test: "GLF-PRUEBA-2026-018" },
  );
  assert.equal(
    suggestCallCodes(["GLF-2026-999"], now).official,
    "GLF-2026-1000",
  );
  assert.equal(
    suggestCallCodes([], Date.parse("2027-01-01T05:59:59Z")).official,
    "GLF-2026-001",
  );
  assert.equal(
    suggestCallCodes([], Date.parse("2027-01-01T06:00:00Z")).official,
    "GLF-2027-001",
  );
});

import {
  partnerOrganizations,
  partnerIssues,
  partnerText,
} from "../src/lib/partners";
test("partner organizations preserve historical text and optional empty lists", () => {
  assert.deepEqual(
    partnerOrganizations({ partners: "Fundación A, sede Galápagos" }),
    ["Fundación A, sede Galápagos"],
  );
  assert.deepEqual(
    partnerOrganizations({
      partners: "Texto previo",
      associated_organizations: [],
    }),
    [],
  );
  assert.deepEqual(
    partnerIssues({ partners: "", associated_organizations: [] }),
    [],
  );
  assert.deepEqual(
    partnerIssues({ partners: "1. A", associated_organizations: ["A", " "] }),
    ["partners"],
  );
  assert.equal(partnerText([" A ", "B"]), "1. A\n2. B");
  const payload = emptyPayload();
  payload.concept.associated_organizations = ["A", "B"];
  assert.deepEqual(
    payloadSchema.parse(payload).concept.associated_organizations,
    ["A", "B"],
  );
});

import { activityPlanningIssues } from "../src/lib/activity-planning";
import { newActivity, newRisk } from "../src/lib/domain";
import { newObjective, alignmentVersion } from "../src/lib/strategic-alignment";
test("activity planning validates links without requiring screening early or losing risks after edits", () => {
  const p = emptyPayload();
  assert.deepEqual(activityPlanningIssues(p), ["activities"]);
  const objective = {
    ...newObjective("specific"),
    text: "Recuperar hábitats costeros",
  };
  p.concept.strategic_alignment = {
    version: alignmentVersion,
    objectives: [newObjective("general"), objective],
  };
  const a = newActivity();
  a.title = "Restauración";
  a.description = "Restaurar sitios seleccionados";
  p.activities = [a];
  assert.deepEqual(activityPlanningIssues(p), ["activity_objectives_1"]);
  a.objective_ids = [objective.id];
  assert.deepEqual(activityPlanningIssues(p), []);
  const risk = newRisk();
  risk.probability = 3;
  risk.severity = 4;
  a.risks = [risk];
  objective.text = "Recuperar hábitats con participación comunitaria";
  a.title = "Restauración participativa";
  assert.deepEqual(activityPlanningIssues(p), []);
  assert.equal(a.risks[0].id, risk.id);
  assert.equal(a.risks[0].severity, 4);
  p.concept.strategic_alignment.objectives = [];
  assert.deepEqual(activityPlanningIssues(p), ["activity_objectives_1"]);
});
