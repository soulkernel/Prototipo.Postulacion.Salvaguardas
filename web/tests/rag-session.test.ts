import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ragInput,
  ragEvent,
  ragFailure,
  readRagLines,
  exportRagResult,
} from "../src/lib/rag-session";
import { validateQwenCitations } from "../src/lib/qwen-contract";
import { parseReviewEvidence } from "../src/lib/rag-review";

test("input limits agree with both methods and reject whitespace, bad types and oversize", () => {
  for (const method of ["e5", "qwen"] as const) {
    const min = method === "e5" ? 10 : 3,
      max = method === "e5" ? 1500 : 600;
    for (const query of [
      " ".repeat(min),
      "x".repeat(min - 1),
      "x".repeat(max + 1),
      123,
      null,
    ])
      assert.equal(ragInput.safeParse({ method, query }).success, false);
    for (const query of ["x".repeat(min), "x".repeat(max)])
      assert.ok(ragInput.safeParse({ method, query }).success);
  }
  assert.equal(
    ragInput.safeParse({
      method: "qwen",
      query: "pregunta",
      retrieval_query: "x",
    }).success,
    false,
  );
});
test("failure messages distinguish confirmed quota, configuration, timeout and corrupt response", () => {
  assert.equal(ragFailure(new Error("GLF_INFERENCE_HTTP_429")), "quota");
  assert.equal(
    ragFailure(new Error("GLF_INFERENCE_HTTP_401")),
    "configuration",
  );
  assert.equal(
    ragFailure(new DOMException("expired", "TimeoutError")),
    "timeout",
  );
  assert.equal(ragFailure(new Error("GLF_MODEL_MISMATCH")), "invalid-response");
  assert.equal(
    ragFailure(new Error("PRIVATE provider text credit maybe")),
    "unavailable",
  );
});
test("stream parser handles split UTF-8 and rejects malformed or oversized service data", async () => {
  const bytes = new TextEncoder().encode(
    '{"type":"stage","stage":"generation","model":"Qwen · prueba","requestId":"00000000-0000-4000-8000-000000000001"}\n',
  );
  const received: unknown[] = [];
  const response = new Response(
    new ReadableStream({
      start(c) {
        for (let i = 0; i < bytes.length; i++) c.enqueue(bytes.slice(i, i + 1));
        c.close();
      },
    }),
  );
  await readRagLines(response, (value) => received.push(ragEvent.parse(value)));
  assert.equal(received.length, 1);
  await assert.rejects(readRagLines(new Response("not JSON"), () => {}));
  await assert.rejects(
    readRagLines(new Response("x".repeat(220001)), () => {}),
  );
  assert.equal(
    ragEvent.safeParse({ type: "stage", stage: "invented", model: "Qwen" })
      .success,
    false,
  );
});
const source = {
  chunk_id: "GLF::P01C01",
  document_id: "GLF",
  source_name: "Manual",
  source_url: "https://galapagoslifefund.org.ec/manual.pdf",
  page: 1,
};
const response = {
  generated: true,
  public_demo: true as const,
  answer: "Norma [GLF::P01C01]",
  sources: [source],
  results: [{ ...source, text: "Texto", score: 1 }],
  timings: { total_seconds: 1 },
  model: "Qwen/test",
  review_support_version: "1.6",
};
test("unknown or missing answer citations fail; historic saved evidence remains readable", () => {
  assert.ok(validateQwenCitations(response));
  for (const answer of ["Sin citas", "Norma [OTHER::P01C01]"])
    assert.throws(() => validateQwenCitations({ ...response, answer }));
  assert.ok(parseReviewEvidence("qwen", response));
  const historic = { ...response };
  delete (historic as Partial<typeof response>).model;
  delete (historic as Partial<typeof response>).review_support_version;
  assert.ok(parseReviewEvidence("qwen", historic));
  assert.ok(
    validateQwenCitations({
      ...response,
      generated: false,
      sources: [],
      answer: "Sin evidencia",
    }),
  );
});
test("export preserves submitted query, context and original source locators", () => {
  const text = exportRagResult(
    {
      method: "qwen",
      query: "Pregunta original",
      requestId: "00000000-0000-4000-8000-000000000001",
      seconds: 2,
      version: "0.7.60",
      model: "Qwen/test",
      results: [],
      response,
    },
    "Riesgo A / fase 1",
    true,
  );
  assert.ok(
    text.includes("Pregunta original") &&
      text.includes("Riesgo A / fase 1") &&
      text.includes("#page=1") &&
      text.includes("GLF::P01C01"),
  );
});
