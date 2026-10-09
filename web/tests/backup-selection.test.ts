import { test } from "node:test";
import assert from "node:assert/strict";
import { backupSelectionSchema } from "../src/lib/backup-selection";
const id = "7f3af678-2728-41d5-8ff6-bfb5fa1395cf";
test("backup scope never broadens an empty or conflicting selection", () => {
  for (const selection of [
    {},
    { scope: "selected", applications: [] },
    { scope: "call", call: "" },
    { scope: "all", applications: [id] },
    { scope: "selected", applications: [id, id] },
    { scope: "selected", applications: ["invalid"] },
    { scope: "call", call: id, applications: [id] },
  ])
    assert.equal(backupSelectionSchema.safeParse(selection).success, false);
  assert.equal(backupSelectionSchema.safeParse({ scope: "all" }).success, true);
  assert.equal(
    backupSelectionSchema.safeParse({ scope: "call", call: id }).success,
    true,
  );
  assert.equal(
    backupSelectionSchema.safeParse({ scope: "selected", applications: [id] })
      .success,
    true,
  );
});
