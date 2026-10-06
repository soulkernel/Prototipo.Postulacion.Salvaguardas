import "server-only";
import { EMBEDDING_MODEL, validateEmbedding } from "./embedding";

export function ragConfigured() {
  return Boolean(process.env.GLF_E5_ENDPOINT && process.env.GLF_E5_API_KEY);
}

export async function embedQuery(query: string) {
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
    body: JSON.stringify({ inputs: [query], kind: "query" }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error("GLF_INFERENCE_UNAVAILABLE");
  const data = await response.json();
  if (
    data.model !== EMBEDDING_MODEL ||
    !Array.isArray(data.embeddings) ||
    data.embeddings.length !== 1
  )
    throw new Error("GLF_MODEL_MISMATCH");
  return validateEmbedding(data.embeddings[0]);
}
