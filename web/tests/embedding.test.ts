import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateEmbedding,
  requestEmbeddings,
  EMBEDDING_MODEL,
} from "../src/lib/embedding";

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

test("E5 recovers from transient transport or provider failures with one identical retry", async () => {
  for (const failure of [
    new TypeError("fetch failed"),
    new DOMException("Timeout", "TimeoutError"),
    502,
    503,
    504,
  ]) {
    const requests: { url: string; body: unknown }[] = [];
    const transport: typeof fetch = async (url, options) => {
      requests.push({ url: String(url), body: options?.body });
      assert.equal(options?.redirect, "error");
      assert.equal(options?.cache, "no-store");
      if (requests.length === 1) {
        if (failure instanceof Error) throw failure;
        return new Response("Unavailable", { status: failure });
      }
      return Response.json({
        model: EMBEDDING_MODEL,
        embeddings: [Array(384).fill(2)],
      });
    };
    const vectors = await requestEmbeddings(
      "https://e5.example.test/embed",
      "server-only-test-key",
      ["manglares"],
      "query",
      transport,
    );
    assert.equal(vectors.length, 1);
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0], requests[1]);
    assert.ok(Math.abs(Math.hypot(...vectors[0]) - 1) < 1e-12);
  }
});

test("E5 bounds permanent outages and never retries credentials, quota or invalid model/vector responses", async () => {
  for (const status of [401, 403, 422, 429, 500, 503]) {
    let calls = 0;
    await assert.rejects(
      requestEmbeddings(
        "https://e5.example.test/embed",
        "key",
        ["query"],
        "query",
        async () => {
          calls++;
          return new Response("Failure", { status });
        },
      ),
      new RegExp(`GLF_INFERENCE_HTTP_${status}`),
    );
    assert.equal(calls, status === 503 ? 2 : 1);
  }
  for (const body of [
    { model: "different-model", embeddings: [Array(384).fill(1)] },
    { model: EMBEDDING_MODEL, embeddings: [] },
    { model: EMBEDDING_MODEL, embeddings: [Array(768).fill(1)] },
    { model: EMBEDDING_MODEL, embeddings: [Array(384).fill(0)] },
  ]) {
    let calls = 0;
    await assert.rejects(
      requestEmbeddings(
        "https://e5.example.test/embed",
        "key",
        ["query"],
        "query",
        async () => {
          calls++;
          return Response.json(body);
        },
      ),
    );
    assert.equal(calls, 1);
  }
  let calls = 0;
  const failing: typeof fetch = async () => {
    calls++;
    throw new TypeError("network");
  };
  await assert.rejects(
    requestEmbeddings(
      "https://e5.example.test/embed",
      "key",
      ["query"],
      "query",
      failing,
    ),
  );
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(
    requestEmbeddings(
      "http://e5.example.test/embed",
      "key",
      ["query"],
      "query",
      failing,
    ),
    /GLF_INVALID_ENDPOINT/,
  );
  assert.equal(calls, 0);
});
