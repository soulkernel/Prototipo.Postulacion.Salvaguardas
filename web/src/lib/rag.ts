import "server-only";
import { EMBEDDING_MODEL, validateEmbedding } from "./embedding";

export function ragConfigured() {
  return Boolean(process.env.GLF_E5_ENDPOINT && process.env.GLF_E5_API_KEY);
}

export async function embedQuery(query: string) {
  return (await embedTexts([query], "query"))[0];
}

export async function embedTexts(inputs: string[], kind: "query" | "passage") {
  const endpoint = process.env.GLF_E5_ENDPOINT;
  const key = process.env.GLF_E5_API_KEY;
  if (!endpoint || !key) throw new Error("GLF_RAG_NOT_CONFIGURED");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("GLF_INVALID_ENDPOINT");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs, kind }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`GLF_INFERENCE_HTTP_${response.status}`);
  const data = await response.json();
  if (
    data.model !== EMBEDDING_MODEL ||
    !Array.isArray(data.embeddings) ||
    data.embeddings.length !== inputs.length
  )
    throw new Error("GLF_MODEL_MISMATCH");
  return data.embeddings.map(validateEmbedding) as number[][];
}
