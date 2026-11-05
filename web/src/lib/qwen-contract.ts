import { z } from "zod";

const source = z.object({
  chunk_id: z.string().min(1).max(250),
  document_id: z.string().min(1).max(250),
  source_name: z.string().min(1).max(300),
  source_url: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "galapagoslifefund.org.ec" &&
        !url.username &&
        !url.password
      );
    }),
  page: z.number().int().positive(),
});
export const answerMode = z.enum(["brief", "expanded"]);
export type AnswerMode = z.infer<typeof answerMode>;
export const qwenDiagnostics = z
  .object({
    policy_version: z.string().min(1).max(80),
    retrieval_method: z.string().min(1).max(100),
    corpus_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    context_ids: z.array(z.string().min(1).max(250)).max(5),
    context_chars: z.number().int().min(0).max(18000),
    max_output_tokens: z.number().int().min(1).max(1500),
    provider_attempts: z.number().int().min(0).max(2),
    usage_complete: z.boolean(),
    input_tokens: z.number().int().min(0).max(2000000).nullable(),
    output_tokens: z.number().int().min(0).max(2000000).nullable(),
    finish_reason: z.enum([
      "stop",
      "length",
      "content_filter",
      "tool_calls",
      "not_reported",
    ]),
  })
  .refine(
    (d) =>
      !d.usage_complete ||
      (d.provider_attempts > 0 &&
        d.input_tokens !== null &&
        d.output_tokens !== null),
    "Incomplete usage must not be presented as complete",
  );
export const qwenResponse = z
  .object({
    answer: z.string().min(1).max(20000),
    generated: z.boolean(),
    retrieval_query: z.string().trim().min(3).max(600).optional(),
    reason: z
      .enum([
        "answered",
        "insufficient_context",
        "citation_validation_failed",
        "response_truncated",
        "generation_incomplete",
      ])
      .optional(),
    answer_mode: answerMode.optional(),
    diagnostics: qwenDiagnostics.optional(),
    public_demo: z.literal(true),
    model: z.string().min(1).max(150).optional(),
    review_support_version: z.string().max(80).optional(),
    sources: z.array(source).max(5),
    results: z
      .array(
        source.extend({
          text: z.string().max(20000),
          score: z.number().finite(),
        }),
      )
      .max(5),
    timings: z.object({
      total_seconds: z.number().finite().nonnegative(),
      retrieval_seconds: z.number().finite().nonnegative().optional(),
      generation_seconds: z.number().finite().nonnegative().optional(),
      context_seconds: z.number().finite().nonnegative().optional(),
      verification_seconds: z.number().finite().nonnegative().optional(),
    }),
  })
  .superRefine((result, ctx) => {
    const ids = new Set(result.results.map((row) => row.chunk_id));
    const uniqueSources = new Set(result.sources.map((row) => row.chunk_id));
    const diagnostics = result.diagnostics;
    if (
      diagnostics &&
      (new Set(diagnostics.context_ids).size !==
        diagnostics.context_ids.length ||
        diagnostics.context_ids.some((id) => !ids.has(id)) ||
        result.sources.some(
          (s) => !diagnostics.context_ids.includes(s.chunk_id),
        ))
    )
      ctx.addIssue({
        code: "custom",
        message: "Context must match returned evidence",
      });
    if (
      result.generated &&
      ((result.reason && result.reason !== "answered") ||
        (diagnostics &&
          ["length", "content_filter", "tool_calls"].includes(
            diagnostics.finish_reason,
          )))
    )
      ctx.addIssue({
        code: "custom",
        message: "Incomplete generation cannot be a grounded answer",
      });
    if (
      ids.size !== result.results.length ||
      uniqueSources.size !== result.sources.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Duplicate evidence identifiers",
      });
    if (
      result.sources.some((row) => {
        const evidence = result.results.find(
          (item) => item.chunk_id === row.chunk_id,
        );
        return (
          !evidence ||
          evidence.document_id !== row.document_id ||
          evidence.source_name !== row.source_name ||
          evidence.source_url !== row.source_url ||
          evidence.page !== row.page
        );
      }) ||
      (result.generated && !result.sources.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "Sources must refer to returned evidence",
      });
    if (!result.generated && result.sources.length)
      ctx.addIssue({
        code: "custom",
        message: "Abstention must not be presented as a grounded answer",
      });
  });
export type QwenResponse = z.infer<typeof qwenResponse>;

export function validateQwenCitations(value: unknown): QwenResponse {
  const result = qwenResponse.parse(value);
  if (result.generated) {
    const cited = new Set(
      [...result.answer.matchAll(/\[([^\[\]\n]+::[^\[\]\n]+)\]/g)].map(
        (m) => m[1],
      ),
    );
    const sources = new Set(result.sources.map((s) => s.chunk_id));
    if (
      !cited.size ||
      [...cited].some((id) => !sources.has(id)) ||
      [...sources].some((id) => !cited.has(id))
    )
      throw new Error("invalid-response");
  }
  return result;
}

export async function requestQwen(
  endpoint: string,
  key: string,
  query: string,
  request: typeof fetch = fetch,
  retrievalQuery?: string,
  mode?: AnswerMode,
): Promise<QwenResponse> {
  const url = new URL(endpoint);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".hf.space") ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname !== "/api/ask" ||
    url.search ||
    url.hash
  )
    throw new Error("configuration");
  if (!key || query.trim().length < 3 || query.length > 600)
    throw new Error("invalid");
  if (
    retrievalQuery !== undefined &&
    (retrievalQuery.trim().length < 3 || retrievalQuery.length > 600)
  )
    throw new Error("invalid");
  if (mode !== undefined) answerMode.parse(mode);
  const response = await request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Demo-Key": key },
    body: JSON.stringify({
      query: query.trim(),
      ...(mode ? { answer_mode: mode } : {}),
      ...(retrievalQuery === undefined
        ? {}
        : { retrieval_query: retrievalQuery.trim() }),
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(55000),
  });
  if (response.status === 429) throw new Error("quota");
  if (!response.ok) throw new Error("unavailable");
  const body = await response.text();
  if (body.length > 150000) throw new Error("invalid-response");
  return validateQwenCitations(JSON.parse(body));
}
