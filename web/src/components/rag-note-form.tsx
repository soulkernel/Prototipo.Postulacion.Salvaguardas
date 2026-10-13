"use client";
import { useActionState, useState } from "react";
import { saveRagNote } from "@/app/internal/evidence/actions";
import { ActionLabel } from "./submit-button";
import type { RagProject, RagRisk } from "@/lib/rag-context";
import {
  prepareApplicantObservation,
  selectedReferences,
} from "@/lib/rag-review";
export function RagNoteForm({
  context,
  method,
  query,
  evidence,
  es,
  selectedIds,
  onSaved,
}: {
  context: { project: RagProject; risk: RagRisk };
  method: string;
  query: string;
  evidence: unknown;
  es: boolean;
  selectedIds: string[];
  onSaved: () => void;
}) {
  const [observation, setObservation] = useState("");
  const [instruction, setInstruction] = useState("");
  const [preparedFor, setPreparedFor] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);
  const fingerprint =
    [...selectedIds].sort().join("|") + "::" + instruction.trim();
  const confirmed = confirmedFor === fingerprint;
  const references = selectedReferences(method, evidence, selectedIds, es);
  const stale = preparedFor !== null && preparedFor !== fingerprint;
  const [state, action, pending] = useActionState(
    async (previous: { status: string }, form: FormData) => {
      const result = await saveRagNote(previous, form);
      if (result.status === "saved") onSaved();
      return result;
    },
    { status: "idle" },
  );
  const locked = pending || state.status === "saved";
  function prepare() {
    setObservation(
      prepareApplicantObservation(
        context.risk,
        context.project.stage,
        references,
        instruction,
        es,
      ),
    );
    setPreparedFor(fingerprint);
    setConfirmedFor(null);
    setReplace(false);
  }
  return (
    <form action={action} className="live-form rag-note-form">
      <h3>
        {es
          ? "Preparar observación al aplicante"
          : "Prepare applicant observation"}
      </h3>
      <p>
        {es
          ? `Evidencias seleccionadas: ${references.length}. Marque los pasajes pertinentes en las tarjetas anteriores. El borrador utiliza el riesgo y sus referencias; no se envía automáticamente al aplicante.`
          : `Selected passages: ${references.length}. Select relevant passages above. The draft uses the risk and your references; it is not automatically sent to the applicant.`}
      </p>
      {references.length > 0 && (
        <ul>
          {references.map((ref) => (
            <li key={ref.id}>
              {ref.name} · {ref.locator}
            </li>
          ))}
        </ul>
      )}
      <label>
        {es
          ? "Qué desea que el aplicante aclare (opcional)"
          : "What should the applicant clarify? (optional)"}
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          maxLength={1000}
          rows={2}
          spellCheck
          lang={es ? "es" : "en"}
          disabled={locked}
          placeholder={
            es
              ? "Por ejemplo: precise la duración de la intervención y sustente la probabilidad de afectación a la fauna."
              : "For example: clarify the intervention duration and the basis for the likelihood of wildlife disturbance."
          }
        />
      </label>
      <button
        type="button"
        className="button secondary"
        disabled={locked || !references.length}
        onClick={() => {
          if (observation.trim()) setReplace(true);
          else prepare();
        }}
      >
        {es ? "Preparar borrador de observación" : "Prepare observation draft"}
      </button>
      {replace && (
        <div className="rag-replace-notice" role="alert">
          <p>
            {es
              ? "Preparar otro borrador reemplazará el texto que está editando. ¿Desea continuar?"
              : "Preparing another draft will replace your current text. Continue?"}
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => setReplace(false)}
          >
            {es ? "Conservar mi texto" : "Keep my text"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={locked || !references.length}
            onClick={prepare}
          >
            {es ? "Reemplazar por nuevo borrador" : "Replace with new draft"}
          </button>
        </div>
      )}
      {stale && (
        <p role="alert">
          {es
            ? "Modificó la evidencia o la aclaración solicitada. Actualice el borrador y revise sus referencias antes de guardar."
            : "The evidence or requested clarification changed. Update the draft and check its references before saving."}
        </p>
      )}
      <input type="hidden" name="application_id" value={context.project.id} />
      <input type="hidden" name="revision" value={context.project.revision} />
      <input type="hidden" name="risk_id" value={context.risk.id} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="query" value={query} />
      <input
        type="hidden"
        name="evidence"
        value={JSON.stringify({
          ...(evidence as object),
          selected_ids: selectedIds,
          draft_kind: "applicant_observation",
        })}
      />
      <label>
        {es ? "Observación del técnico *" : "Reviewer observation *"}
        <textarea
          name="observation"
          value={observation}
          onChange={(e) => {
            setObservation(e.target.value);
            setConfirmedFor(null);
          }}
          required
          maxLength={5000}
          rows={9}
          spellCheck
          lang={es ? "es" : "en"}
          disabled={locked}
          placeholder={
            es
              ? "Prepare un borrador o escriba su observación; luego revísela antes de guardar."
              : "Prepare a draft or write your observation, then review it before saving."
          }
        />
      </label>
      <label className="rag-evidence-choice">
        <input
          type="checkbox"
          name="review_confirmed"
          checked={confirmed}
          onChange={(e) =>
            setConfirmedFor(e.target.checked ? fingerprint : null)
          }
          required
          disabled={locked || stale}
        />
        <span>
          {es
            ? "He revisado la observación y la pertinencia de las referencias seleccionadas."
            : "I have reviewed the observation and the relevance of the selected references."}
        </span>
      </label>
      <button
        className="button primary"
        disabled={
          locked ||
          stale ||
          !confirmed ||
          !references.length ||
          !observation.trim()
        }
        aria-busy={pending}
      >
        <ActionLabel
          busy={pending}
          pendingLabel={es ? "Guardando…" : "Saving…"}
        >
          {state.status === "saved"
            ? es
              ? "Observación guardada"
              : "Observation saved"
            : es
              ? "Guardar observación en el expediente"
              : "Save observation to application"}
        </ActionLabel>
      </button>
      <p role="status">
        {state.status === "saved"
          ? es
            ? "Observación y selección guardadas en el expediente interno. No se ha enviado ningún mensaje al aplicante."
            : "Observation and selection saved internally. No message has been sent to the applicant."
          : state.status === "invalid"
            ? es
              ? "Seleccione evidencia, complete la observación y confirme su revisión."
              : "Select evidence, complete the observation and confirm review."
            : state.status === "error"
              ? es
                ? "No se pudo guardar. Su texto permanece en pantalla; intente nuevamente."
                : "Save failed. Your text remains on screen; please retry."
              : ""}
      </p>
    </form>
  );
}
