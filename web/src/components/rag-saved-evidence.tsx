import { qwenResponse } from "@/lib/qwen-contract";
import { z } from "zod";
export function RagSavedEvidence({
  evidence,
  method,
  es,
}: {
  evidence: unknown;
  method: string;
  es: boolean;
}) {
  const qwen = method === "qwen" ? qwenResponse.safeParse(evidence) : null;
  const e5 =
    method === "e5"
      ? z
          .object({
            results: z.array(
              z.object({
                document_name: z.string(),
                document_version: z.string(),
                locator: z.string(),
                content: z.string(),
              }),
            ),
          })
          .safeParse(evidence)
      : null;
  return (
    <details>
      <summary>
        {es
          ? "Ver respuesta y evidencia guardadas"
          : "View saved response and evidence"}
      </summary>
      {qwen?.success && (
        <>
          <p>{qwen.data.answer}</p>
          {qwen.data.sources.map((s) => (
            <p key={s.chunk_id}>
              <a
                href={`${s.source_url.split("#")[0]}#page=${s.page}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.source_name} · {es ? "Página" : "Page"} {s.page}
              </a>
            </p>
          ))}
        </>
      )}
      {e5?.success &&
        e5.data.results.map((s, i) => (
          <article key={i}>
            <strong>
              {s.document_name} · {s.document_version} · {s.locator}
            </strong>
            <p>{s.content}</p>
          </article>
        ))}
    </details>
  );
}
