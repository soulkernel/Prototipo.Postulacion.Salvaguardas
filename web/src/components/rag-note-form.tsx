"use client";
import { useActionState } from "react";
import { saveRagNote } from "@/app/internal/evidence/actions";
import { ActionLabel } from "./submit-button";
import type { RagProject, RagRisk } from "@/lib/rag-context";
export function RagNoteForm({
  context,
  method,
  query,
  evidence,
  es,
}: {
  context: { project: RagProject; risk: RagRisk };
  method: string;
  query: string;
  evidence: unknown;
  es: boolean;
}) {
  const [state, action, pending] = useActionState(saveRagNote, {
    status: "idle",
  });
  return (
    <form action={action} className="live-form rag-note-form">
      <h3>{es ? "Guardar apoyo a la revisión" : "Save review support"}</h3>
      <p>
        {es
          ? "Registra esta consulta y sus resultados junto con su observación. No constituye una decisión ni cambia la calificación."
          : "Records this query and results with your observation. This is not a decision and does not change the rating."}
      </p>
      <input type="hidden" name="application_id" value={context.project.id} />
      <input type="hidden" name="revision" value={context.project.revision} />
      <input type="hidden" name="risk_id" value={context.risk.id} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="query" value={query} />
      <input type="hidden" name="evidence" value={JSON.stringify(evidence)} />
      <label>
        {es ? "Observación del técnico *" : "Reviewer observation *"}
        <textarea
          name="observation"
          required
          maxLength={5000}
          rows={3}
          spellCheck
          lang={es ? "es" : "en"}
          disabled={pending || state.status === "saved"}
          placeholder={
            es
              ? "Indique qué evidencia resulta pertinente y qué debe aclararse."
              : "Explain which evidence is relevant and what needs clarification."
          }
        />
      </label>
      <button
        className="button secondary"
        disabled={pending || state.status === "saved"}
        aria-busy={pending}
      >
        <ActionLabel
          busy={pending}
          pendingLabel={es ? "Guardando…" : "Saving…"}
        >
          {state.status === "saved"
            ? es
              ? "Consulta guardada"
              : "Consultation saved"
            : es
              ? "Guardar en la revisión del riesgo"
              : "Save to risk review"}
        </ActionLabel>
      </button>
      <p role="status">
        {state.status === "saved"
          ? es
            ? "Consulta y observación guardadas en el expediente interno."
            : "Consultation and observation saved to the internal record."
          : state.status === "invalid"
            ? es
              ? "Complete la observación antes de guardar."
              : "Complete the observation before saving."
            : state.status === "error"
              ? es
                ? "No se pudo guardar. Su observación permanece en pantalla; intente nuevamente."
                : "Save failed. Your observation remains on screen; please retry."
              : ""}
      </p>
    </form>
  );
}
