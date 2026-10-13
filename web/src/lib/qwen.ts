import "server-only";
import { requestQwen } from "./qwen-contract";
export function qwenConfigured() {
  return Boolean(process.env.GLF_QWEN_ENDPOINT && process.env.GLF_QWEN_API_KEY);
}
export async function askQwen(query: string, retrievalQuery?: string) {
  if (!qwenConfigured()) throw new Error("configuration");
  return requestQwen(
    process.env.GLF_QWEN_ENDPOINT!,
    process.env.GLF_QWEN_API_KEY!,
    query,
    fetch,
    retrievalQuery,
  );
}
