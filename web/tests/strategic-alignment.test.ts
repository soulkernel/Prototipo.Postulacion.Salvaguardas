import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alignmentVersion,
  strategicSchema,
  suggestedOds,
  newObjective,
  alignmentIssues,
  strategicText,
  type StrategicAlignment,
  newOtherInstrument,
  legacyAlignmentVersion,
  currentAlignmentVersion,
} from "../src/lib/strategic-alignment";
import { payloadSchema, emptyPayload } from "../src/lib/domain";
import { conceptSections } from "../src/lib/concept-presentation";
import { completionGuidance } from "../src/lib/completion-guidance";
import { stepIssues } from "../src/lib/step-validation";

function m13Fixture() {
  const general = {
    ...newObjective("general"),
    text: "Conservar hábitats",
    plan: ["E1"],
    ods: [14],
    contribution: "Conservación comunitaria",
  };
  const specific = { ...newObjective("specific"), text: "Restaurar hábitats" };
  return {
    version: alignmentVersion,
    objectives: [general, specific],
  } satisfies StrategicAlignment;
}

test("M15 v3 omits contribution generation and validation while v2 retains historical semantics", () => {
  const value: StrategicAlignment = m13Fixture();
  value.version = currentAlignmentVersion;
  for (const objective of value.objectives) delete objective.contribution;
  assert.equal(
    "contribution" in newObjective("general", currentAlignmentVersion),
    false,
  );
  assert.equal(
    "contribution" in newObjective("specific", currentAlignmentVersion),
    false,
  );
  assert.deepEqual(strategicSchema.parse(value), value);
  assert.deepEqual(alignmentIssues(value), []);
  assert.doesNotMatch(strategicText(value).alignment, /Contribución esperada/);
  assert.equal(
    strategicSchema.safeParse({ ...value, version: alignmentVersion }).success,
    false,
  );
  value.objectives[0].contribution = "APORTE_HISTORICO_M15";
  const before = structuredClone(value);
  for (const locale of ["es", "en"] as const) {
    const c = { ...emptyPayload().concept, strategic_alignment: value };
    const sections = conceptSections(c, locale);
    const alignment = JSON.stringify(
      sections.find((s) => s.id === "alignment"),
    );
    assert.doesNotMatch(
      alignment,
      /APORTE_HISTORICO_M15|Contribución esperada|Expected contribution/,
    );
    assert.doesNotMatch(
      strategicText(value, locale).alignment,
      /APORTE_HISTORICO_M15/,
    );
    assert.ok(sections.some((s) => s.id === "beneficiaries"));
    const historical: typeof c = {
      ...c,
      strategic_alignment: { ...value, version: alignmentVersion },
    };
    assert.match(
      JSON.stringify(conceptSections(historical, locale)),
      /APORTE_HISTORICO_M15/,
    );
  }
  assert.deepEqual(value, before);
  value.objectives[0].plan = [];
  assert.ok(alignmentIssues(value).includes("alignment"));
});

test("M13 optional instruments roundtrip and edits preserve all objective identities and links", () => {
  const old = m13Fixture();
  assert.deepEqual(
    strategicSchema.parse(old),
    old,
    "Do not add defaults to historical objects",
  );
  const value: StrategicAlignment = structuredClone(old);
  const first = {
    ...newOtherInstrument(),
    name: "Plan ficticio M13",
    objective: "P1: Restaurar ecosistemas",
  };
  const second = {
    ...newOtherInstrument(),
    name: "Plan local ficticio",
    objective: "Objetivo 2: Participación comunitaria",
  };
  value.objectives[0].other_instruments = [first, second];
  const p = emptyPayload();
  p.concept.strategic_alignment = value;
  p.activities = [
    {
      id: crypto.randomUUID(),
      title: "Prueba",
      description: "Prueba",
      objective_ids: [old.objectives[1].id],
      no_risks_reason: "Sin riesgos",
      risks: [],
    },
  ];
  const reopened = payloadSchema.parse(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(reopened.concept.strategic_alignment, value);
  const edited = structuredClone(value);
  edited.objectives[0].other_instruments![0].name = "Plan ficticio actualizado";
  edited.objectives[0].other_instruments!.reverse();
  edited.objectives[0].other_instruments =
    edited.objectives[0].other_instruments!.filter((i) => i.id !== first.id);
  assert.deepEqual(
    edited.objectives.map((o) => o.id),
    old.objectives.map((o) => o.id),
  );
  assert.deepEqual(reopened.activities[0].objective_ids, [
    old.objectives[1].id,
  ]);
  assert.deepEqual(edited.objectives[0].other_instruments, [second]);
  assert.deepEqual(alignmentIssues(value), []);
});

test("M13 incomplete instruments save as drafts but block completion and point to missing fields in ES/EN", () => {
  const value: StrategicAlignment = m13Fixture();
  const instrument = newOtherInstrument();
  value.objectives[0].other_instruments = [instrument];
  assert.equal(strategicSchema.safeParse(value).success, true);
  assert.ok(alignmentIssues(value).includes("other_instruments"));
  const p = emptyPayload();
  p.concept.strategic_alignment = value;
  const rules = {
    categories: [],
    applicant_types: ["individual"],
    summary_word_limit: 500,
    max_admin_percent: 10,
    required_attachments: [],
    privacy_es: "",
    privacy_en: "",
    themes: [],
  };
  assert.ok(stepIssues(p, rules, 1, 1).missing.includes("other_instruments"));
  for (const locale of ["es", "en"] as const) {
    const issues = completionGuidance(p, rules, 1, [], locale);
    for (const field of ["name", "objective"])
      assert.ok(
        issues.some(
          (i) =>
            i.selector === `[id="other-instrument-${field}-${instrument.id}"]`,
        ),
      );
  }
  instrument.name = "Plan ficticio";
  assert.ok(alignmentIssues(value).includes("other_instruments"));
  instrument.objective = "Objetivo ficticio";
  assert.deepEqual(alignmentIssues(value), []);
  value.objectives[0].plan = [];
  assert.ok(
    alignmentIssues(value).includes("alignment"),
    "Other does not replace Plan 2030",
  );
  value.objectives[0].plan = ["E1"];
  value.objectives[0].ods = [];
  assert.ok(
    alignmentIssues(value).includes("alignment"),
    "ODS remain mandatory",
  );
});

test("M13 rejects forged instruments, duplicate identifiers and alignment on specific or legacy objectives", () => {
  const source = m13Fixture();
  const item = {
    ...newOtherInstrument(),
    name: "Plan ficticio",
    objective: "Objetivo externo",
  };
  for (const items of [
    [{ ...item, id: "invalid" }],
    [item, item],
    [{ ...item, name: null }],
    [{ ...item, objective: "x".repeat(2001) }],
    [{ ...item, extra: "unknown" }],
    Array.from({ length: 11 }, () => ({ ...item, id: crypto.randomUUID() })),
  ])
    assert.equal(
      strategicSchema.safeParse({
        ...source,
        objectives: [
          { ...source.objectives[0], other_instruments: items },
          source.objectives[1],
        ],
      }).success,
      false,
    );
  assert.equal(
    strategicSchema.safeParse({
      ...source,
      objectives: [
        source.objectives[0],
        { ...source.objectives[1], other_instruments: [item] },
      ],
    }).success,
    false,
  );
  assert.equal(
    strategicSchema.safeParse({
      ...source,
      version: legacyAlignmentVersion,
      objectives: [
        { ...source.objectives[0], other_instruments: [item] },
        source.objectives[1],
      ],
    }).success,
    false,
  );
});

test("M13 natural-language presentation shares the added alignment across review and PDF, preserving legacy output", () => {
  const value: StrategicAlignment = m13Fixture();
  const p = emptyPayload();
  p.concept.strategic_alignment = value;
  const original = structuredClone(p);
  for (const locale of ["es", "en"] as const) {
    const prior = conceptSections(p.concept, locale);
    const v = strategicSchema.parse(JSON.parse(JSON.stringify(value)));
    assert.deepEqual(
      conceptSections({ ...p.concept, strategic_alignment: v }, locale),
      prior,
    );
  }
  value.objectives[0].other_instruments = [
    {
      ...newOtherInstrument(),
      name: "Plan ficticio M13",
      objective: "E2: Restaurar bosques",
    },
  ];
  for (const locale of ["es", "en"] as const) {
    assert.match(strategicText(value, locale).alignment, /Plan ficticio M13/);
    const section = conceptSections(p.concept, locale).find(
      (s) => s.id === "alignment",
    )!;
    const text = section.blocks
      .map((b) => (b.type === "paragraph" ? b.text : ""))
      .join("\n");
    assert.match(text, /Plan ficticio M13/);
    assert.match(text, /E2: Restaurar bosques/);
    assert.match(
      text,
      locale === "es"
        ? /el objetivo general también se alinea/
        : /the general objective also aligns/,
    );
  }
  assert.equal(
    original.concept.strategic_alignment?.objectives[0].other_instruments,
    undefined,
  );
});
test("legacy payload remains compatible", () =>
  assert.equal(payloadSchema.safeParse(emptyPayload()).success, true));
test("Plan policies suggest the documented ODS without selecting them", () => {
  assert.deepEqual(suggestedOds(["C2"]), [4, 8, 9, 10, 12, 13, 16, 17]);
  assert.deepEqual(suggestedOds(["unknown"]), []);
});
test("objective IDs, versions and catalogue references cannot be forged", () => {
  const o = newObjective("general");
  const v = { version: alignmentVersion, objectives: [o] };
  assert.equal(strategicSchema.safeParse(v).success, true);
  for (const patch of [
    { plan: ["X1"] },
    { ods: [18] },
    { glf: ["GLF-L99"] },
    { ods: [14, 14] },
  ])
    assert.equal(
      strategicSchema.safeParse({ ...v, objectives: [{ ...o, ...patch }] })
        .success,
      false,
    );
  assert.equal(
    strategicSchema.safeParse({ ...v, version: "unknown" }).success,
    false,
  );
  assert.equal(
    strategicSchema.safeParse({ ...v, objectives: [o, o] }).success,
    false,
  );
});
test("only the general objective requires Plan, SDGs and contribution", () => {
  const general = {
    ...newObjective("general"),
    text: "Conservar ecosistemas",
    plan: ["E1"],
    ods: [14],
    glf: [],
    contribution: "Restauración de hábitat costero",
  };
  const specific = {
    ...newObjective("specific"),
    text: "Restaurar hábitat",
    contribution: "",
  };
  const value: StrategicAlignment = {
    version: alignmentVersion,
    objectives: [general, specific],
  };
  assert.deepEqual(alignmentIssues(value), []);
  assert.deepEqual(alignmentIssues(value), []);
  assert.ok(
    alignmentIssues({
      ...value,
      objectives: [{ ...general, ods: [] }, specific],
    }).includes("alignment"),
  );
  assert.ok(
    alignmentIssues({
      ...value,
      objectives: [{ ...general, contribution: "" }, specific],
    }).includes("alignment"),
  );
  assert.equal(strategicSchema.safeParse(value).success, true);
  assert.equal(
    strategicSchema.safeParse({
      ...value,
      objectives: [general, { ...specific, plan: ["E1"] }],
    }).success,
    false,
  );
  assert.doesNotMatch(strategicText(value).alignment, /GLF|Restaurar hábitat/);
  assert.match(strategicText(value).alignment, /E1/);
  assert.match(strategicText(value, "en").alignment, /Expected contribution/);
});
