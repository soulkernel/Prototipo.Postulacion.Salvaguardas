import { getViewer } from "@/lib/data";
import { embedQuery, ragConfigured } from "@/lib/rag";
import { askQwen, qwenConfigured } from "@/lib/qwen";
import { EMBEDDING_MODEL } from "@/lib/embedding";
import {
  evidenceRows,
  ragFailure,
  ragInput,
  type RagStage,
} from "@/lib/rag-session";
import { version } from "../../../../../package.json";

export const maxDuration = 90;
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const fail = (code: string, status: number) =>
    Response.json(
      { type: "error", code, requestId },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return fail("forbidden", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail("invalid", 400);
  let input;
  try {
    const body = await request.text();
    if (body.length > 12000) return fail("invalid", 400);
    input = ragInput.parse(JSON.parse(body));
  } catch {
    return fail("invalid", 400);
  }
  const viewer = await getViewer();
  if (!viewer) return fail("session", 401);
  if (viewer.profile.access_kind !== "academic") {
    if (
      !["sustainability_reviewer", "administrator"].includes(
        viewer.profile.role,
      )
    )
      return fail("forbidden", 403);
    const { data, error } =
      await viewer.db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || data?.currentLevel !== "aal2") return fail("session", 401);
  }
  if (!(input.method === "e5" ? ragConfigured() : qwenConfigured()))
    return fail("configuration", 503);
  if (viewer.profile.access_kind === "academic") {
    const { data, error } = await viewer.db.rpc("consume_academic_query");
    if (error) return fail("unavailable", 503);
    if (!data) return fail("quota", 429);
  }
  const parsed = input,
    started = performance.now();
  let closed = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        if (!closed)
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(event) + "\n"),
          );
      };
      const stage = (value: RagStage) =>
        send({ type: "stage", ...value, requestId });
      const heartbeat = setInterval(() => send({ type: "heartbeat" }), 8000);
      try {
        let response,
          results: ReturnType<typeof evidenceRows.parse> = [],
          model;
        if (parsed.method === "e5") {
          model = EMBEDDING_MODEL;
          stage({ stage: "embedding", model });
          const embedding = await embedQuery(parsed.query);
          if (closed) return;
          stage({ stage: "retrieval", model: "Supabase · pgvector" });
          const { data, error } = await viewer.db.rpc("match_evidence", {
            query_embedding: JSON.stringify(embedding),
            result_limit: 6,
          });
          if (error) throw new Error("unavailable");
          results = evidenceRows.parse(data || []);
        } else {
          stage({ stage: "connecting", model: "BM25 + Qwen · Hugging Face" });
          response = await askQwen(
            parsed.query,
            parsed.retrieval_query,
            stage,
            request.signal,
            parsed.answer_mode,
          );
          model =
            response.model || "Qwen · modelo no informado por el servicio";
          stage({ stage: "verification", model });
        }
        send({
          type: "result",
          result: {
            method: parsed.method,
            query: parsed.query,
            requestId,
            seconds: (performance.now() - started) / 1000,
            version,
            model,
            results,
            ...(response ? { response } : {}),
          },
        });
      } catch (error) {
        const code = ragFailure(error);
        console.error("GLF_RAG_REQUEST", {
          requestId,
          method: parsed.method,
          code,
        });
        send({ type: "error", code, requestId });
      } finally {
        clearInterval(heartbeat);
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
    },
  });
}
