import "server-only";
import { requestEmbeddings } from "./embedding";

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
  return requestEmbeddings(endpoint, key, inputs, kind);
}
