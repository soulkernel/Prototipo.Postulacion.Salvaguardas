import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoneyEntry, parseMoneyEntry } from "../src/lib/money-input";
import {
  emptyPayload,
  conceptSchema,
  financialErrors,
} from "../src/lib/domain";

test("USD entry accepts decimal point/comma, cents, empty and explicit grouped pasted amounts", () => {
  for (const [raw, expected] of [
    ["", null],
    ["  ", null],
    ["0", 0],
    ["0,00", 0],
    ["0.00", 0],
    ["12500", 12500],
    ["12500,50", 12500.5],
    ["12500.50", 12500.5],
    ["100,", 100],
    ["100.", 100],
    ["100,0", 100],
    ["100.0", 100],
    [",05", 0.05],
    [".05", 0.05],
    [" 12500,50 ", 12500.5],
    ["12.500,50", 12500.5],
    ["12,500.50", 12500.5],
    ["1.234.567,89", 1234567.89],
    ["1,234,567.89", 1234567.89],
    ["999999999999,99", 999999999999.99],
  ] as const)
    assert.deepEqual(
      parseMoneyEntry(raw),
      { valid: true, value: expected },
      raw,
    );
});

test("USD entry rejects ambiguous thousands, malformed grouping, excess precision and unsupported values without guessing", () => {
  for (const raw of [
    "100.000",
    "100,000",
    "1.234",
    "1,234",
    "1000.000",
    "1000,000",
    "1.00,50",
    "1,00.50",
    "1.234,567",
    "1,234.567",
    "1..2",
    "1,,2",
    "1,2.3",
    "1.2,3",
    "100abc",
    "USD 100",
    "$100",
    "1e5",
    "-10",
    "+10",
    "Infinity",
    "NaN",
    ".",
    ",",
    "1 000",
    "1\n000",
    "1000000000000",
    "999999999999.999",
  ])
    assert.deepEqual(parseMoneyEntry(raw), { valid: false, value: null }, raw);
});

test("USD display uses locale formatting and preserves historical numbers without mutating or rounding them", () => {
  assert.equal(formatMoneyEntry(null, "es"), "");
  assert.equal(formatMoneyEntry(0, "es"), "0,00");
  assert.equal(formatMoneyEntry(12500.5, "es"), "12.500,50");
  assert.equal(formatMoneyEntry(12500.5, "en"), "12,500.50");
  assert.equal(formatMoneyEntry(12.345, "es"), "12,345");
  for (const value of [
    0, 0.01, 0.1, 12500.5, 100000, 250000.01, 999999999999.99,
  ]) {
    for (const locale of ["es", "en"] as const) {
      const formatted = formatMoneyEntry(value, locale);
      assert.deepEqual(parseMoneyEntry(formatted), { valid: true, value });
    }
  }
});

test("Parsed requested and cofinance amounts remain numeric and preserve the existing financial rules", () => {
  const p = emptyPayload();
  const r = {
    categories: [
      {
        id: "medium",
        label_es: "Mediana",
        label_en: "Medium",
        min_amount: 100000.01,
        max_amount: 250000,
        max_months: 24,
        cofinance_percent: 10,
      },
    ],
    max_admin_percent: 10,
  };
  Object.assign(p.concept, {
    applicant_type: "organization",
    category_id: "medium",
    requested_amount: parseMoneyEntry("125000,50").value,
    cofinance_amount: parseMoneyEntry("12500.05").value,
  });
  assert.ok(conceptSchema.safeParse(p.concept).success);
  assert.equal(typeof p.concept.requested_amount, "number");
  assert.equal(p.concept.requested_amount, 125000.5);
  assert.equal(p.concept.cofinance_amount, 12500.05);
  assert.equal(
    financialErrors(p.concept, r as Parameters<typeof financialErrors>[1], 1)
      .cofinance_amount,
    undefined,
  );
  p.concept.cofinance_amount = 12500.04;
  assert.equal(
    financialErrors(p.concept, r as Parameters<typeof financialErrors>[1], 1)
      .cofinance_amount,
    "COFINANCE",
  );
  p.concept.requested_amount = 250000.01;
  assert.equal(
    financialErrors(p.concept, r as Parameters<typeof financialErrors>[1], 1)
      .requested_amount,
    "CATEGORY_AMOUNT",
  );
});
