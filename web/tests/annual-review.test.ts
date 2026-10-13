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
