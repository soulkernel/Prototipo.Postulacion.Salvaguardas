import { test } from "node:test";
import assert from "node:assert/strict";
import { requestQwen, qwenResponse } from "../src/lib/qwen-contract";

const source = {
  chunk_id: "GLF::P1",
  document_id: "GLF",
  source_name: "Manual GLF",
  source_url: "https://galapagoslifefund.org.ec/manual.pdf",
  page: 1,
};
const grounded = {
  generated: true,
  public_demo: true,
  answer: "Evidencia [GLF::P1]",
  sources: [source],
  results: [{ ...source, text: "Fragmento normativo", score: 1 }],
  timings: { total_seconds: 1.2 },
};
test("Qwen validates original evidence and safe abstention independently", () => {
  assert.ok(qwenResponse.safeParse(grounded).success);
  assert.ok(
    qwenResponse.safeParse({
      ...grounded,
      generated: false,
      sources: [],
      results: [],
      answer: "Evidencia insuficiente",
    }).success,
  );
  for (const value of [
    { ...grounded, sources: [] },
    { ...grounded, generated: false },
    { ...grounded, sources: [{ ...source, page: 2 }] },
    {
      ...grounded,
      sources: [{ ...source, source_url: "https://attacker.example/" }],
    },
    { ...grounded, sources: [source, source] },
    { ...grounded, results: [] },
  ])
    assert.equal(qwenResponse.safeParse(value).success, false);
});
test("Qwen refuses unsafe destinations before sending the service credential", async () => {
  let calls = 0;
  const transport = (async () => {
    calls++;
    return Response.json(grounded);
  }) as typeof fetch;
  for (const url of [
    "http://localhost/api/ask",
    "https://example.com/api/ask",
    "https://glf.hf.space/api/ask?key=x",
    "https://user:pass@glf.hf.space/api/ask",
    "https://glf.hf.space:8443/api/ask",
  ])
    await assert.rejects(requestQwen(url, "secret", "pregunta", transport));
  assert.equal(calls, 0);
});
test("Qwen sends credentials only to the backend and handles quotas and failures", async () => {
  const transport = (async (_url, options) => {
    assert.equal(new Headers(options?.headers).get("X-Demo-Key"), "secret");
    assert.equal(options?.redirect, "error");
    assert.equal(options?.cache, "no-store");
    assert.equal(options?.body, JSON.stringify({ query: "pregunta" }));
    return Response.json(grounded);
  }) as typeof fetch;
  assert.equal(
    (
      await requestQwen(
        "https://glf.hf.space/api/ask",
        "secret",
        " pregunta ",
        transport,
      )
    ).answer,
    grounded.answer,
  );
  for (const [status, code] of [
    [429, "quota"],
    [401, "unavailable"],
    [500, "unavailable"],
  ] as const)
    await assert.rejects(
      requestQwen(
        "https://glf.hf.space/api/ask",
        "secret",
        "pregunta",
        (async () => new Response("failure", { status })) as typeof fetch,
      ),
      new RegExp(code),
    );
  await assert.rejects(
    requestQwen(
      "https://glf.hf.space/api/ask",
      "secret",
      "pregunta",
      (async () => new Response("not-json")) as typeof fetch,
    ),
  );
});

test("partial retrieval on abstention remains evidence and never grounded sources", () => {
  const result = {
    ...grounded,
    generated: false,
    sources: [],
    reason: "citation_validation_failed",
  };
  assert.ok(qwenResponse.safeParse(result).success);
  assert.equal(
    qwenResponse.safeParse({ ...result, sources: [source] }).success,
    false,
  );
  assert.equal(
    qwenResponse.safeParse({ ...result, reason: "invented" }).success,
    false,
  );
});

test("question and focused retrieval are transmitted separately and invalid search is rejected before transport", async () => {
  let calls = 0;
  const transport = (async (_url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(String(options?.body)), {
      query: "Pregunta de revisión",
      retrieval_query: "manglar biodiversidad hábitats",
    });
    return Response.json({
      ...grounded,
      retrieval_query: "manglar biodiversidad hábitats",
    });
  }) as typeof fetch;
  const result = await requestQwen(
    "https://glf.hf.space/api/ask",
    "secret",
    "Pregunta de revisión",
    transport,
    "manglar biodiversidad hábitats",
  );
  assert.equal(result.retrieval_query, "manglar biodiversidad hábitats");
  await assert.rejects(
    requestQwen(
      "https://glf.hf.space/api/ask",
      "secret",
      "Pregunta de revisión",
      transport,
      "x".repeat(601),
    ),
    /invalid/,
  );
  assert.equal(calls, 1);
});
