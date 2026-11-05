import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  emptyPayload,
  newActivity,
  newRisk,
  riskSchema,
  riskScore,
  riskLevel,
} from "../src/lib/domain";
import { riskLevelLabel } from "../src/lib/fields";
import {
  riskInterpretation,
  riskInterpretationKeys,
  riskVariableTone,
} from "../src/lib/risk-interpretation";
import {
  RiskCategoryResult,
  RiskInterpretationGuide,
  RiskRatingField,
} from "../src/components/risk-rating-fields";
import { RiskReferenceTable } from "../src/components/risk-reference-table";

test("Ulf original definitions stay distinct, ordered, bilingual and unmodified at probability 4/5", () => {
  assert.deepEqual(
    riskInterpretationKeys.map((row) => row.value),
    [5, 4, 3, 2, 1],
  );
  assert.equal(
    riskInterpretation(4, "probability", "es"),
    "El riesgo sin duda se materializará.",
  );
  assert.equal(
    riskInterpretation(5, "probability", "es"),
    "El riesgo casi con toda seguridad se materializará.",
  );
  assert.equal(
    riskInterpretation(4, "probability", "en"),
    "The risk will certainly materialise.",
  );
  assert.equal(
    riskInterpretation(5, "probability", "en"),
    "The risk will almost certainly materialise.",
  );
  assert.equal(
    riskInterpretation(1, "severity", "es"),
    "Insignificante, mínimo o inexistente.",
  );
  assert.equal(
    riskInterpretation(2, "probability", "en"),
    "It is possible that the risk will not materialise.",
  );
  for (const value of [null, 0, 6, 1.5])
    for (const locale of ["es", "en"] as const)
      assert.equal(riskInterpretation(value, "severity", locale), "");
});

test("each initial/residual field describes its own selected variable and preserves the numeric 1–5 contract", () => {
  for (const locale of ["es", "en"] as const)
    for (const field of [
      "probability",
      "severity",
      "residual_probability",
      "residual_severity",
    ] as const)
      for (const value of [null, 1, 2, 3, 4, 5]) {
        const html = renderToStaticMarkup(
          createElement(RiskRatingField, {
            label: field,
            field,
            value,
            locale,
            onChange: () => assert.fail("Viewing a rating must not mutate it"),
          }),
        );
        assert.match(html, /aria-required="true"/);
        const target = html.match(/aria-describedby="([^"]+)"/)![1];
        assert.ok(html.includes(`id="${target}"`));
        assert.match(html, /aria-live="polite"/);
        assert.ok(html.includes(`data-validation-field="${field}"`));
        assert.equal((html.match(/<option value="[1-5]"/g) || []).length, 5);
        if (value !== null) {
          const variable = field.includes("probability")
            ? "probability"
            : "severity";
          assert.ok(html.includes(riskInterpretation(value, variable, locale)));
          assert.ok(
            html.includes(`risk-scale-definition ${riskVariableTone(value)}`),
          );
          assert.ok(html.includes(`${value}/5`));
        } else {
          assert.ok(
            html.includes(
              locale === "es"
                ? "Seleccione un valor para consultar su significado."
                : "Select a rating to see its meaning.",
            ),
          );
          assert.doesNotMatch(
            html,
            /Selected rating:|Calificación seleccionada:/,
          );
        }
      }
  for (const value of [0, 6, 1.5])
    assert.equal(
      riskSchema.safeParse({ ...newRisk(), probability: value }).success,
      false,
    );
  assert.equal(
    riskSchema.safeParse({ ...newRisk(), probability: null, severity: null })
      .success,
    true,
  );
});

test("the full key guide is consultable without writes and uses the exact criteria in both languages", () => {
  for (const locale of ["es", "en"] as const) {
    const html = renderToStaticMarkup(
      createElement(RiskInterpretationGuide, { locale }),
    );
    assert.match(html, /<details class="risk-interpretation-guide">/);
    assert.doesNotMatch(html, /<details[^>]+open/);
    assert.equal((html.match(/risk-interpretation-row /g) || []).length, 5);
    assert.doesNotMatch(html, /<input|<select|<textarea/);
    for (const row of riskInterpretationKeys) {
      assert.ok(html.includes(row[locale].probability));
      assert.ok(html.includes(row[locale].severity));
    }
  }
});

test("risk categories retain all 25 combinations, the original thresholds and their calculation", () => {
  for (const locale of ["es", "en"] as const)
    for (let probability = 1; probability <= 5; probability++)
      for (let severity = 1; severity <= 5; severity++) {
        const score = probability * severity;
        const expected =
          score <= 4
            ? "low"
            : score <= 9
              ? "medium"
              : score <= 15
                ? "high"
                : "very_high";
        assert.equal(riskScore(probability, severity), score);
        assert.equal(riskLevel(score), expected);
        const html = renderToStaticMarkup(
          createElement(RiskCategoryResult, { probability, severity, locale }),
        );
        assert.ok(html.includes(`risk-category-result ${expected}`));
        assert.ok(
          html.includes(`<strong>${riskLevelLabel(score, locale)}</strong>`),
        );
        assert.ok(html.includes(`${probability} × ${severity} = ${score}`));
        assert.ok(
          html.includes(
            locale === "es" ? "Categoría del riesgo" : "Risk category",
          ),
        );
      }
  const empty = renderToStaticMarkup(
    createElement(RiskCategoryResult, {
      probability: null,
      severity: 5,
      locale: "es",
    }),
  );
  assert.match(empty, /Sin completar/);
  assert.ok(empty.includes("— × 5 = —"));
  const residual = renderToStaticMarkup(
    createElement(
      RiskCategoryResult,
      { probability: 1, severity: 2, locale: "en", residual: true },
      "DURATION_PRESERVED",
    ),
  );
  assert.match(residual, /Residual risk category/);
  assert.match(residual, /DURATION_PRESERVED/);
});

test("phase-two reference table names the actual category and keeps the numeric calculation", () => {
  const p = emptyPayload(),
    a = newActivity(),
    r = newRisk();
  r.name = "RIESGO_FICTICIO";
  r.probability = 3;
  r.severity = 4;
  a.risks = [r];
  p.activities = [a];
  for (const locale of ["es", "en"] as const) {
    const html = renderToStaticMarkup(
      createElement(RiskReferenceTable, {
        payload: p,
        locale,
        references: [],
        onChange: () =>
          assert.fail("Reading a reference table must not change it"),
      }),
    );
    assert.match(html, /3 × 4 = 12/);
    assert.ok(
      html.includes(locale === "es" ? "Categoría del riesgo" : "Risk category"),
    );
    assert.ok(
      html.includes(`<strong>${locale === "es" ? "Alto" : "High"}</strong>`),
    );
  }
});
