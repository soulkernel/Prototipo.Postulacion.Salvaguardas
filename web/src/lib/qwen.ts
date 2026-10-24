import "server-only";
import {
  requestQwen,
  validateQwenCitations,
  type QwenResponse,
  type AnswerMode,
} from "./qwen-contract";
import { readRagLines, ragStage, type RagStage } from "./rag-session";
export function qwenConfigured() {
  return Boolean(process.env.GLF_QWEN_ENDPOINT && process.env.GLF_QWEN_API_KEY);
}
export async function askQwen(
  query: string,
  retrievalQuery?: string,
  progress?: (stage: RagStage) => void,
  signal?: AbortSignal,
  mode?: AnswerMode,
) {
  if (!qwenConfigured()) throw new Error("configuration");
  if (progress) {
    const url = new URL(process.env.GLF_QWEN_ENDPOINT!);
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
    url.pathname = "/api/ask-stream";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Demo-Key": process.env.GLF_QWEN_API_KEY!,
      },
      body: JSON.stringify({
        query,
        ...(mode ? { answer_mode: mode } : {}),
        ...(retrievalQuery ? { retrieval_query: retrievalQuery } : {}),
      }),
      signal: AbortSignal.any([
        AbortSignal.timeout(60000),
        ...(signal ? [signal] : []),
      ]),
      cache: "no-store",
      redirect: "error",
    });
    // An old service has not consumed a generation quota for an unknown route.
    if (response.status !== 404) {
      if (response.status === 429) throw new Error("quota");
      if ([401, 403].includes(response.status))
        throw new Error("configuration");
      if (!response.ok) throw new Error("unavailable");
      let result: QwenResponse | undefined,
        terminal = false;
      await readRagLines(response, (value) => {
        if (!value || typeof value !== "object" || !("type" in value))
          throw new Error("invalid-response");
        const event = value as Record<string, unknown>;
        if (terminal) throw new Error("invalid-response");
        if (event.type === "stage") progress(ragStage.parse(event));
        else if (event.type === "result") {
          result = validateQwenCitations(event.result);
          terminal = true;
        } else if (event.type === "error")
          throw new Error(
            event.code === "invalid"
              ? "invalid"
              : event.code === "quota"
                ? "quota"
                : event.code === "configuration"
                  ? "configuration"
                  : "unavailable",
          );
        else if (event.type !== "heartbeat")
          throw new Error("invalid-response");
      });
      if (!result) throw new Error("invalid-response");
      return result;
    }
    await response.body?.cancel();
  }
  return requestQwen(
    process.env.GLF_QWEN_ENDPOINT!,
    process.env.GLF_QWEN_API_KEY!,
    query,
    fetch,
    retrievalQuery,
    mode,
  );
}
