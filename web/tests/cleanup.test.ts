import { test } from "node:test";
import assert from "node:assert/strict";
import { correctionWindow } from "../src/lib/correction-window";
import { requestEmbeddings } from "../src/lib/embedding";
import { requestQwen } from "../src/lib/qwen-contract";

test("correction dates use Galápagos and never exceed the active phase deadline", () => {
  const now = Date.parse("2026-11-12T12:00:30Z");
  assert.deepEqual(correctionWindow(1, "2026-11-12T14:00:00Z", null, now), {
    allowed: true, min: "2026-11-12T06:01", max: "2026-11-12T08:00",
  });
  assert.equal(correctionWindow(1, "2026-11-12T12:00:30Z", "2027-01-01", now).allowed, false);
  assert.equal(correctionWindow(2, "2027-01-01", null, now).allowed, false);
  assert.equal(correctionWindow(2, "2025-01-01", "2026-11-13T12:00:00Z", now).allowed, true);
});

test("cancelled E5 requests stop the provider and never retry", async () => {
  let attempts = 0;
  const cancellation = new AbortController();
  const transport = (async (_url, options) => {
    attempts++;
    assert.ok(options?.signal);
    cancellation.abort();
    options.signal.throwIfAborted();
    throw new Error("must not reach");
  }) as typeof fetch;
  await assert.rejects(requestEmbeddings("https://example.hf.space/embed", "test", ["query"], "query", transport, cancellation.signal), { name: "AbortError" });
  assert.equal(attempts, 1);
  await assert.rejects(requestEmbeddings("https://example.hf.space/embed", "test", ["query"], "query", transport, cancellation.signal), { name: "AbortError" });
  assert.equal(attempts, 1);
});

test("the Qwen fallback also honors cancellation before and during its request", async () => {
  let attempts = 0;
  const cancellation = new AbortController();
  const transport = (async (_url, options) => {
    attempts++;
    cancellation.abort(); options?.signal?.throwIfAborted();
    throw new Error("must not reach");
  }) as typeof fetch;
  await assert.rejects(requestQwen("https://example.hf.space/api/ask", "test", "consulta", transport, undefined, undefined, cancellation.signal), { name: "AbortError" });
  await assert.rejects(requestQwen("https://example.hf.space/api/ask", "test", "consulta", transport, undefined, undefined, cancellation.signal), { name: "AbortError" });
  assert.equal(attempts, 1);
});
