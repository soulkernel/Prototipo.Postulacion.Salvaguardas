"use client";
import {
  attachmentAccept,
  conditionLabel,
  type AttachmentRules,
} from "@/lib/attachment-requirements";
import { requiredAttachments } from "@/lib/attachment-requirements";
import { FileDropField } from "./file-drop-field";
import { DocumentDownload } from "./document-download";
import { ActionLabel } from "./submit-button";
import type { Locale } from "@/lib/domain";

export function RequiredAttachmentUploads({
  rules,
  stage,
  locale,
  documents,
  busy,
  onUpload,
}: {
  rules: AttachmentRules;
  stage: number;
  locale: Locale;
  documents: { id: string; file_name: string; kind: string }[];
  busy: boolean;
  onUpload: (form: HTMLFormElement) => Promise<void>;
}) {
  const es = locale === "es";
  const requirements = requiredAttachments(rules).filter(
    (r) => stage !== 1 || !["concept_signed", "matrix_signed"].includes(r.id),
  );
  if (!requirements.length) return null;
  return (
    <section className="required-attachment-uploads">
      <h3>
        {es
          ? "Anexos requeridos por la convocatoria"
          : "Attachments required by this call"}
      </h3>
      {requirements.map((r) => (
        <form
          key={r.id}
          className="live-form call-attachment-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (e.currentTarget.reportValidity())
              void onUpload(e.currentTarget);
          }}
        >
          <h4>{es ? r.label_es : r.label_en}</h4>
          {!documents.some((d) => d.kind === r.id) && (
            <p>{es ? "Pendiente de cargar." : "Not yet uploaded."}</p>
          )}
          <input type="hidden" name="kind" value={r.id} />
          <p>
            {es ? "Formatos admitidos" : "Accepted formats"}:{" "}
            {r.formats.map((f) => f.toUpperCase()).join(", ")} ·{" "}
            {es ? "Máximo 4 MB" : "Maximum 4 MB"}
          </p>
          {!!r.conditions.length && (
            <ul>
              {r.conditions.map((c) => (
                <li key={c}>{conditionLabel(c, es)}</li>
              ))}
            </ul>
          )}
          {(es ? r.instructions_es : r.instructions_en) && (
            <p className="call-preserve-lines">
              {es ? r.instructions_es : r.instructions_en}
            </p>
          )}
          {(r.conditions.includes("notarized") ||
            r.conditions.includes("electronic_signature")) && (
            <p className="field-help">
              {es
                ? "La autenticidad de la firma y la notarización serán verificadas por GLF."
                : "GLF will verify signature authenticity and notarization."}
            </p>
          )}
          {documents
            .filter((d) => d.kind === r.id)
            .map((d) => (
              <div className="document-row" key={d.id}>
                <span>{d.file_name}</span>
                <DocumentDownload href={`/files/${d.id}`} locale={locale}>
                  {es ? "Descargar" : "Download"}
                </DocumentDownload>
              </div>
            ))}
          <FileDropField
            locale={locale}
            accept={attachmentAccept(r)}
            disabled={busy}
          />
          <button className="button secondary" disabled={busy} aria-busy={busy}>
            <ActionLabel
              busy={busy}
              pendingLabel={es ? "Guardando…" : "Saving…"}
            >
              {es ? "Guardar anexo" : "Save attachment"}
            </ActionLabel>
          </button>
        </form>
      ))}
    </section>
  );
}
