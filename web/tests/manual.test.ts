import { test } from "node:test";
import assert from "node:assert/strict";
import {
  internalManualChapters,
  internalManualGuide,
} from "../src/lib/internal-manual";
import { manualChapters, manualFormSteps } from "../src/lib/applicant-manual";
import { searchManualChapters } from "../src/lib/manual-types";
import {
  canReadInternalManual,
  internalManualRoles,
} from "../src/lib/internal-manual-access";

test("both guides have unique reachable chapters and complete bilingual instructions", () => {
  for (const [chapters, journey] of [
    [internalManualChapters, internalManualGuide.journey],
    [manualChapters, manualFormSteps],
  ] as const) {
    const ids = new Set(chapters.map((chapter) => chapter.id));
    assert.equal(ids.size, chapters.length);
    for (const step of journey)
      assert.ok(ids.has(step[2]), `Broken journey: ${step[2]}`);
    for (const c of chapters) {
      assert.match(c.id, /^[a-z0-9-]+$/);
      assert.ok(c.steps.length && c.rows.length && c.screen.length, c.id);
      for (const pair of [
        c.title,
        c.intro,
        c.tip,
        ...c.steps,
        ...c.screen,
        ...c.rows,
        ...(c.audience ? [c.audience] : []),
        ...(c.outcome ? [c.outcome] : []),
      ]) {
        for (const text of pair)
          assert.ok(text.trim(), `${c.id}: blank translation`);
      }
    }
  }
});
test("manual search finds controls and errors regardless of accents, case or word order", () => {
  const find = (q: string, i: 0 | 1 = 0) =>
    searchManualChapters(internalManualChapters, q, i).map((c) => c.id);
  assert.ok(find("  CORRECCION  autorizar ").includes("correcciones"));
  assert.ok(find("GLF_VERSION_CONFLICT").includes("incidencias"));
  assert.ok(find("Qwen fuentes").includes("rag"));
  assert.ok(find("technical review", 1).includes("revision"));
  assert.deepEqual(find("xyzzynonexistent123"), []);
  assert.equal(find("   ").length, internalManualChapters.length);
  assert.ok(searchManualChapters(manualChapters, "firma", 0).length > 0);
});
test("reading the internal guide is limited to internal roles and academic readers", () => {
  for (const role of internalManualRoles)
    assert.equal(
      canReadInternalManual({ role, access_kind: "standard" }),
      true,
    );
  assert.equal(
    canReadInternalManual({ role: "applicant", access_kind: "standard" }),
    false,
  );
  assert.equal(
    canReadInternalManual({ role: "applicant", access_kind: "academic" }),
    true,
  );
});
