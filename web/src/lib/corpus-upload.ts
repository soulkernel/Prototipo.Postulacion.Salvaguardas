export async function sendCorpusBatch(
  items: unknown[],
  request: typeof fetch = fetch,
  wait = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "NETWORK";
    let retryable = true;
    try {
      const response = await request("/api/corpus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
        signal: AbortSignal.timeout(40000),
      });
      if (response.ok) return;
      const data = await response.json().catch(() => ({}));
      code =
        typeof data.code === "string" && /^GLF_[A-Z0-9_]+$/.test(data.code)
          ? data.code
          : `HTTP_${response.status}`;
      retryable =
        data.retryable === true ||
        [429, 502, 503, 504].includes(response.status);
    } catch {
      // A lost response may have committed; import_evidence is idempotent.
    }
    if (!retryable || attempt === 4) throw new Error(code);
    await wait(2000 * 2 ** attempt);
  }
}
