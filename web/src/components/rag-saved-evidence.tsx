import { parseReviewEvidence, selectedReferences } from "@/lib/rag-review";
export function RagSavedEvidence({
  evidence,
  method,
  es,
}: {
  evidence: unknown;
  method: string;
  es: boolean;
}) {
  const parsed = parseReviewEvidence(method, evidence);
  if (!parsed) return null;
  const ids =
    parsed.selected_ids ??
    parsed.results.map((row) => ("id" in row ? String(row.id) : row.chunk_id));
  const references = selectedReferences(method, evidence, ids, es);
  return (
    <details>
      <summary>
        {es
          ? parsed.selected_ids
            ? `Ver evidencia seleccionada (${references.length})`
            : "Ver respuesta y evidencia guardadas"
          : parsed.selected_ids
            ? `View selected evidence (${references.length})`
            : "View saved answer and evidence"}
      </summary>
      {"answer" in parsed && parsed.generated && (
        <p className="rag-answer">{parsed.answer}</p>
      )}
      {references.map((ref) => (
        <article key={ref.id}>
          <strong>
            {ref.name} · {ref.locator}
          </strong>
          <p className="rag-answer">{ref.text}</p>
        </article>
      ))}
    </details>
  );
}
