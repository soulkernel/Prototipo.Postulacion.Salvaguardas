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
