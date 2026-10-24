import { z } from "zod";
import { qwenResponse } from "./qwen-contract";

export const ragInput = z
  .object({
    method: z.enum(["e5", "qwen"]),
    query: z.string().trim().min(3).max(1500),
    retrieval_query: z.string().trim().min(3).max(600).optional(),
  })
  .superRefine((v, ctx) => {
    if (
      v.query.length < (v.method === "e5" ? 10 : 3) ||
      v.query.length > (v.method === "e5" ? 1500 : 600)
    )
      ctx.addIssue({ code: "custom", path: ["query"], message: "invalid" });
  });
export type RagInput = z.infer<typeof ragInput>;
export const ragCodes = z.enum([
  "invalid",
  "offline",
  "timeout",
  "quota",
  "configuration",
  "unavailable",
  "session",
  "forbidden",
  "invalid-response",
  "cancelled",
]);
export type RagCode = z.infer<typeof ragCodes>;
export const ragStage = z.object({
  stage: z.enum([
    "connecting",
    "embedding",
    "retrieval",
    "generation",
    "verification",
  ]),
  model: z.string().max(150).optional(),
});
export type RagStage = z.infer<typeof ragStage>;
export const evidenceRows = z
  .array(
    z.object({
      id: z.number().int().positive(),
      document_name: z.string().max(1000),
      document_version: z.string().max(1000),
      locator: z.string().max(1000),
      content: z.string().max(20000),
      similarity: z.number().finite(),
    }),
  )
  .max(6);
export const ragResult = z
  .object({
    method: z.enum(["e5", "qwen"]),
    query: z.string().max(1500),
    requestId: z.string().uuid(),
    seconds: z.number().finite().nonnegative(),
    version: z.string().max(80),
    model: z.string().max(150),
    results: evidenceRows,
    response: qwenResponse.optional(),
  })
  .refine((v) => v.method !== "qwen" || !!v.response);
export type RagResult = z.infer<typeof ragResult>;
export const ragEvent = z.discriminatedUnion("type", [
  ragStage.extend({ type: z.literal("stage"), requestId: z.string().uuid() }),
  z.object({ type: z.literal("result"), result: ragResult }),
  z.object({
    type: z.literal("error"),
    code: ragCodes,
    requestId: z.string().uuid().optional(),
  }),
  z.object({ type: z.literal("heartbeat") }),
]);

export function ragFailure(error: unknown): RagCode {
  if (
    error instanceof Error &&
    ["TimeoutError", "AbortError"].includes(error.name)
  )
    return "timeout";
  const message = error instanceof Error ? error.message : "";
  if (message === "GLF_INFERENCE_HTTP_429") return "quota";
  if (
    [
      "GLF_RAG_NOT_CONFIGURED",
      "GLF_INVALID_ENDPOINT",
      "GLF_INFERENCE_HTTP_401",
      "GLF_INFERENCE_HTTP_403",
    ].includes(message)
  )
    return "configuration";
  if (
    [
      "GLF_MODEL_MISMATCH",
      "Invalid E5 embedding",
      "Empty E5 embedding",
    ].includes(message) ||
    error instanceof z.ZodError ||
    error instanceof SyntaxError
  )
    return "invalid-response";
  return ragCodes.safeParse(message).success
    ? (message as RagCode)
    : "unavailable";
}

/** Bounded NDJSON reader. Never render unvalidated service payloads. */
export async function readRagLines(
  response: Response,
  receive: (value: unknown) => void,
) {
  if (!response.body) throw new Error("invalid-response");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (value) size += value.byteLength;
      if (size > 220000) throw new Error("invalid-response");
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) if (line.trim()) receive(JSON.parse(line));
      if (done) {
        if (buffer.trim()) receive(JSON.parse(buffer));
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function exportRagResult(
  result: RagResult,
  context: string,
  es: boolean,
) {
  const answer = result.response?.generated
    ? result.response.answer
    : es
      ? "Sin respuesta fundamentada; consulte los pasajes recuperados."
      : "No grounded answer; review retrieved passages.";
  const sources = result.response
    ? result.response.results.map(
        (r) =>
          `[${r.chunk_id}] ${r.source_name}, ${es ? "página" : "page"} ${r.page}\n${r.source_url.split("#")[0]}#page=${r.page}\n${r.text}`,
      )
    : result.results.map(
        (r) =>
          `[${r.id}] ${r.document_name} · ${r.document_version} · ${r.locator}\n${r.content}`,
      );
  return [
    `GLF · ${es ? "Consulta de salvaguardas" : "Safeguards query"}`,
    context,
    result.query,
    `\n${result.method === "qwen" ? answer : es ? "Búsqueda documental; no genera una respuesta." : "Document search; no generated answer."}`,
    `\n${es ? "Evidencia recuperada" : "Retrieved evidence"}\n${sources.join("\n\n")}`,
    `\n${result.model} · ${result.seconds.toFixed(1)} s · v${result.version}\nID: ${result.requestId}`,
    es
      ? "Compruebe las fuentes y su aplicabilidad. La decisión corresponde al GLF."
      : "Check sources and applicability. GLF retains decision authority.",
  ].join("\n");
}
