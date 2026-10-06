import { test } from "node:test";
import assert from "node:assert/strict";
import {
  safeReturnPath,
  riskLevel,
  riskScore,
  emptyPayload,
  payloadSchema,
} from "../src/lib/domain";
import { csvCell, validateFile } from "../src/lib/files";

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
