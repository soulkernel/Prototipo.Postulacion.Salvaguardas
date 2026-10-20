import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatMoneyEntry,
  parseMoneyEntry,
  moneyEntryError,
} from "../src/lib/money-input";
import { financialFeedback } from "../src/lib/financial-feedback";
import {
  emptyPayload,
  conceptSchema,
  financialErrors,
  type Rules,
} from "../src/lib/domain";

const rules = {
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
  max_admin_percent: 10,
} as Rules;

test("zero-minimum cofinancing explains the zero declaration without calling the contribution mandatory in ES/EN", () => {
  const c = {
    ...emptyPayload().concept,
    applicant_type: "organization",
    category_id: "small",
    requested_amount: 100000,
    cofinance_amount: null,
  };
  const before = JSON.stringify(c);
  for (const locale of ["es", "en"] as const) {
    const untouched = financialFeedback(
      c,
      rules,
      locale,
      {},
      null,
      false,
      1,
    ).cofinance_amount;
    assert.equal(untouched.invalid, false);
    assert.match(
      untouched.text,
      locale === "es"
        ? /Esta categoría no exige cofinanciamiento/
        : /This category does not require cofinancing/,
    );
    const empty = financialFeedback(
      c,
      rules,
      locale,
      {},
      null,
      true,
      1,
    ).cofinance_amount;
    assert.equal(empty.invalid, true);
    assert.equal(
      empty.text,
      locale === "es"
        ? "Indique el aporte previsto o ingrese 0 si no habrá cofinanciamiento."
        : "Enter the planned contribution or enter 0 if there will be no cofinancing.",
    );
    assert.doesNotMatch(empty.text, /obligatorio|required field/);
    assert.equal(
      financialFeedback(
        { ...c, cofinance_amount: 0 },
        rules,
        locale,
        {},
        null,
        true,
        1,
      ).cofinance_amount.invalid,
      false,
    );
    // The call's configured percentage governs the copy; the category ID is not hard-coded.
    const configured = {
      ...rules,
      categories: rules.categories.map((r) => ({
        ...r,
        cofinance_percent: 10,
      })),
    };
    assert.match(
      financialFeedback(c, configured, locale, {}, null, true, 1)
        .cofinance_amount.text,
      locale === "es" ? /campo obligatorio/ : /required field/,
    );
  }
  assert.equal(JSON.stringify(c), before); // No automatic zero or amount changes.
});

test("The screenshot's huge integer prioritizes the category maximum, not a decimal error or a stale stored amount", () => {
  const c = {
    ...emptyPayload().concept,
    applicant_type: "organization",
    category_id: "small",
    requested_amount: 10000,
    cofinance_amount: 0,
  };
  for (const raw of ["100000.01", "100001", "1010000000000", "9".repeat(400)]) {
    const feedback = financialFeedback(
      c,
      rules,
      "es",
      {},
      "requested_amount",
      false,
      1,
      { requested_amount: raw },
    );
    assert.equal(feedback.requested_amount.invalid, true, raw);
    assert.match(
      feedback.requested_amount.text,
      /supera el máximo de 100\.000,00.*Pequeña/,
    );
    assert.doesNotMatch(feedback.requested_amount.text, /decimal/);
    assert.equal(c.requested_amount, 10000);
  }
  assert.doesNotMatch(moneyEntryError("es", "1022222222222"), /decimal/);
  assert.match(moneyEntryError("es", "1022222222222"), /límite numérico/);
  assert.match(moneyEntryError("en", "1022222222222"), /numeric limit/);
  assert.match(moneyEntryError("es", "12500,505"), /dos decimales/);
});

test("Current category ranges, exact cent boundaries, optional small and 10/25 percent minima remain effective", () => {
  const c = {
    ...emptyPayload().concept,
    applicant_type: "organization",
    category_id: "small",
    requested_amount: 100000,
    cofinance_amount: 0,
  };
  for (const [category, requested, cofinance] of [
    ["small", 100000, 0],
    ["medium", 100000.01, 10000.01],
    ["medium", 250000, 25000],
    ["large", 250000.01, 62500.01],
    ["large", 1000000, 250000],
  ] as const) {
    Object.assign(c, {
      category_id: category,
      requested_amount: requested,
      cofinance_amount: cofinance,
    });
    assert.deepEqual(financialErrors(c, rules, 1), {});
    const f = financialFeedback(c, rules, "es", {}, null, true, 1);
    assert.equal(f.requested_amount.invalid, false);
    assert.equal(f.cofinance_amount.invalid, false);
    if (category !== "small") {
      c.cofinance_amount = cofinance - 0.01;
      assert.equal(financialErrors(c, rules, 1).cofinance_amount, "COFINANCE");
      const error = financialFeedback(
        c,
        rules,
        "es",
        {},
        null,
        true,
        1,
      ).cofinance_amount;
      assert.equal(error.invalid, true);
      assert.match(error.text, /inferior al mínimo exigido/);
      assert.ok(error.text.includes(category === "medium" ? "10%" : "25%"));
    }
  }
  Object.assign(c, { category_id: "medium", requested_amount: 250000.01 });
  assert.equal(
    financialErrors(c, rules, 1).requested_amount,
    "CATEGORY_AMOUNT",
  );
  assert.match(
    financialFeedback(c, rules, "en", {}, null, true, 1).requested_amount.text,
    /maximum of.*250,000.00.*Medium/,
  );
  Object.assign(c, {
    category_id: "large",
    requested_amount: 500000,
    cofinance_amount: 900000,
  });
  assert.deepEqual(financialErrors(c, rules, 1), {}); // No business maximum for cofinancing.
});

test("Invalid raw amounts never base cofinancing feedback on an earlier numeric value", () => {
  const c = {
    ...emptyPayload().concept,
    applicant_type: "organization",
    category_id: "medium",
    requested_amount: 200000,
    cofinance_amount: 0,
  };
  for (const raw of ["abc", "1010000000000", ""]) {
    const f = financialFeedback(c, rules, "es", {}, null, true, 1, {
      requested_amount: raw,
    });
    assert.match(f.cofinance_amount.text, /10%/);
    assert.doesNotMatch(f.cofinance_amount.text, /20\.000/);
  }
  c.requested_amount = 250000.01;
  assert.match(
    financialFeedback(c, rules, "es", {}, null, true, 1, {
      requested_amount: "abc",
    }).requested_amount.text,
    /dos decimales/,
  );
  assert.match(
    financialFeedback(c, rules, "es", {}, null, true, 1, {
      cofinance_amount: "1022222222222",
    }).cofinance_amount.text,
    /límite numérico/,
  );
});

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
