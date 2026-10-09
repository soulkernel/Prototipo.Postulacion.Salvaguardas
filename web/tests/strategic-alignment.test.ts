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
} from "../src/lib/strategic-alignment";
import { payloadSchema, emptyPayload } from "../src/lib/domain";
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
test("completion requires actual contribution and project-wide coverage; does not force all frameworks per objective", () => {
  const general = {
    ...newObjective("general"),
    text: "Conservar ecosistemas",
    plan: ["E1"],
    ods: [14],
    glf: ["GLF-L07"],
    contribution: "Restauración de hábitat costero",
  };
  const specific = {
    ...newObjective("specific"),
    text: "Restaurar hábitat",
    plan: ["E1"],
    contribution: "Recuperar sitios degradados",
  };
  const value: StrategicAlignment = {
    version: alignmentVersion,
    objectives: [general, specific],
  };
  assert.deepEqual(alignmentIssues(value), []);
  assert.ok(
    alignmentIssues({
      ...value,
      objectives: [general, { ...specific, contribution: "" }],
    }).includes("alignment"),
  );
  assert.match(strategicText(value).alignment, /E1/);
  assert.match(strategicText(value, "en").alignment, /Expected contribution/);
});
