export const EMBEDDING_MODEL = "intfloat/multilingual-e5-small";

export function validateEmbedding(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    value.length !== 384 ||
    !value.every((n) => typeof n === "number" && Number.isFinite(n))
  ) {
    throw new Error("Invalid E5 embedding");
  }
  const norm = Math.hypot(...value);
  if (norm < 1e-10) throw new Error("Empty E5 embedding");
  return value.map((n: number) => n / norm);
}

// Retry a transient transport failure once, without changing the request/model.
export async function requestEmbeddings(
  endpoint: string,
  key: string,
  inputs: string[],
  kind: "query" | "passage",
  transport: typeof fetch = fetch,
) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("GLF_INVALID_ENDPOINT");
  const body = JSON.stringify({ inputs, kind });
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await transport(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(25000),
      });
    } catch (error) {
      const transient =
        error instanceof TypeError ||
        (error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name));
      if (attempt === 0 && transient) continue;
      throw error;
    }
    if (attempt === 0 && [502, 503, 504].includes(response.status)) {
      await response.body?.cancel();
      continue;
    }
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
  throw new Error("GLF_INFERENCE_UNAVAILABLE");
}
