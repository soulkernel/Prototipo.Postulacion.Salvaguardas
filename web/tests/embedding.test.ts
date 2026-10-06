import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEmbedding } from "../src/lib/embedding";

test("rejects mismatched model dimensions and invalid vectors", () => {
  for (const value of [
    [],
    Array(768).fill(1),
    Array(384).fill(0),
    Array(384).fill(NaN),
    Array(384).fill("1"),
  ])
    assert.throws(() => validateEmbedding(value));
});
test("normalizes valid E5 vectors for cosine search", () => {
  const vector = validateEmbedding(Array(384).fill(2));
  assert.equal(vector.length, 384);
  assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-12);
});
