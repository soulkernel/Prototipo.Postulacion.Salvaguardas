import { test } from "node:test";
import assert from "node:assert/strict";
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
import { stepIssues } from "../src/lib/step-validation";
import { geographyIssues } from "../src/lib/geography";
import { emptySummary, summaryText } from "../src/lib/summary";
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
test("summary limit applies to the combined six sections without counting headings", () => {
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
  p.concept.summary = summaryText(p.concept.summary_parts);
  const rules = { summary_word_limit: 500 } as Rules;
  assert.deepEqual(stepIssues(p, rules, 1, 1).invalid, []);
  p.concept.summary_parts.context += "another";
  assert.ok(stepIssues(p, rules, 1, 1).invalid.includes("summary"));
  p.concept.summary_parts.problem = "";
  assert.ok(stepIssues(p, rules, 1, 1).missing.includes("summary:problem"));
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
    categories: [
      { id: "small", min_amount: 0, max_amount: 100000, cofinance_percent: 0 },
    ],
    max_admin_percent: 10,
    summary_word_limit: 500,
  } as Rules;
  const p = emptyPayload();
  Object.assign(p.concept, {
    category_id: "small",
    requested_amount: 120000,
    cofinance_amount: 12000,
    admin_cost: 50000,
  });
  const both = stepIssues(p, rules, 1, 0);
  assert.ok(both.missing.includes("title"));
  assert.ok(both.missing.includes("contact_name"));
  assert.ok(!both.missing.includes("partners"));
  assert.deepEqual(both.invalid, ["requested_amount", "admin_cost"]);
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
