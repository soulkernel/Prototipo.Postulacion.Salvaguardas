import { test } from "node:test";
import assert from "node:assert/strict";
import { sendCorpusBatch } from "../src/lib/corpus-upload";

test("transient inference errors retry the same batch before advancing", async () => {
  let calls = 0;
  const delays: number[] = [];
  await sendCorpusBatch(
    [{}],
    (async () => {
      calls++;
      return calls < 3
        ? Response.json({ retryable: true }, { status: 503 })
        : Response.json({ imported: 1 });
    }) as typeof fetch,
    async (ms) => {
      delays.push(ms);
    },
  );
  assert.equal(calls, 3);
  assert.deepEqual(delays, [2000, 4000]);
});
test("permanent errors stop immediately and transient failures are bounded", async () => {
  let calls = 0;
  await assert.rejects(
    sendCorpusBatch(
      [],
      (async () => {
        calls++;
        return Response.json({ code: "GLF_CORPUS_DATABASE" }, { status: 422 });
      }) as typeof fetch,
      async () => {},
    ),
    /GLF_CORPUS_DATABASE/,
  );
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(
    sendCorpusBatch(
      [],
      (async () => {
        calls++;
        throw new Error("secret must not be surfaced");
      }) as typeof fetch,
      async () => {},
    ),
    /NETWORK/,
  );
  assert.equal(calls, 5);
});
