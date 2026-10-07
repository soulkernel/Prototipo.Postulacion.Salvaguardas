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
test("new applications reuse editable applicant details without copying project data", () => {
  const original = {
    ...emptyPayload().concept,
    applicant_type: "organization",
    applicant_name: "Example NGO",
    contact_name: "Example Contact",
    email: "contact@example.org",
    phone: "+593991234567",
    address: "Example address",
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
