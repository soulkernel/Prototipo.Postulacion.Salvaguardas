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
export const qwenResponse = z
  .object({
    answer: z.string().min(1).max(20000),
    generated: z.boolean(),
    retrieval_query: z.string().trim().min(3).max(600).optional(),
    reason: z
      .enum(["answered", "insufficient_context", "citation_validation_failed"])
      .optional(),
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
    timings: z.object({ total_seconds: z.number().finite().nonnegative() }),
  })
  .superRefine((result, ctx) => {
    const ids = new Set(result.results.map((row) => row.chunk_id));
    const uniqueSources = new Set(result.sources.map((row) => row.chunk_id));
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
  const response = await request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Demo-Key": key },
    body: JSON.stringify({
      query: query.trim(),
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
