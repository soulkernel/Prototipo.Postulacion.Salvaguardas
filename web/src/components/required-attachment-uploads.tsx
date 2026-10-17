"use client";
import {
  attachmentAccept,
  conditionLabel,
  type AttachmentRules,
} from "@/lib/attachment-requirements";
import {
  applicationAttachments,
  partnerLetterPrefix,
  requiredAttachments,
  isPartnerLetterRequirement,
} from "@/lib/attachment-requirements";
import { useRef, useState } from "react";
import type { Partners } from "@/lib/partners";
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
  concept,
  ready = true,
  uploadError = "",
}: {
  rules: AttachmentRules;
  stage: number;
  locale: Locale;
  documents: { id: string; file_name: string; kind: string }[];
  busy: boolean;
  onUpload: (form: HTMLFormElement) => Promise<void>;
  concept: Partners;
  ready?: boolean;
  uploadError?: string;
}) {
  const es = locale === "es";
  const [activeKind, setActiveKind] = useState("");
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const [localError, setLocalError] = useState("");
  const requirements = applicationAttachments(rules, concept).filter(
    (r) => stage !== 1 || !["concept_signed", "matrix_signed"].includes(r.id),
  );
  const genericIds = requiredAttachments(rules)
    .filter(isPartnerLetterRequirement)
    .map((r) => r.id);
  const unlinked = documents.filter(
    (d) =>
      (d.kind.startsWith(partnerLetterPrefix) ||
        genericIds.includes(d.kind) ||
        (stage === 1 && d.kind === "other")) &&
      !requirements.some((r) => r.id === d.kind),
  );
  const historyTitle = unlinked.some((d) => d.kind === "other")
    ? es
      ? "Archivos conservados sin vínculo con una organización"
      : "Retained files without an organization link"
    : es
      ? "Cartas conservadas sin vínculo actual"
      : "Retained letters without a current link";
  if (!requirements.length && !unlinked.length) return null;
  return (
    <section className="required-attachment-uploads">
      <h3>{es ? "Anexos" : "Attachments"}</h3>
      {stage !== 1 &&
        documents.some((d) => d.kind === "other") &&
        requirements.some((r) => r.id.startsWith(partnerLetterPrefix)) && (
          <p className="field-help">
            {es
              ? "Si una carta anterior figura como Otro anexo, vuelva a cargarla en el campo de su organización para vincularla expresamente. No se asignan cartas automáticamente."
              : "If an earlier letter is listed as Other attachment, upload it in its organization's field to explicitly link it. Letters are not assigned automatically."}
          </p>
        )}
      {!ready &&
        requirements.some((r) => r.id.startsWith(partnerLetterPrefix)) && (
          <p role="status">
            {es
              ? "Guarde los cambios de las organizaciones antes de cargar sus cartas de apoyo."
              : "Save changes to partner organizations before uploading their letters of support."}
          </p>
        )}
      {requirements.map((r) => (
        <form
          key={r.id}
          className="live-form call-attachment-card"
          aria-labelledby={`attachment-title-${r.id}`}
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              busy ||
              locked.current ||
              (r.id.startsWith(partnerLetterPrefix) && !ready) ||
              !e.currentTarget.reportValidity()
            )
              return;
            locked.current = true;
            setActiveKind(r.id);
            setPending(true);
            setLocalError("");
            try {
              await onUpload(e.currentTarget);
            } catch {
              setLocalError(
                es
                  ? "No se pudo cargar el archivo. Inténtelo de nuevo."
                  : "Could not upload the file. Try again.",
              );
            } finally {
              locked.current = false;
              setPending(false);
            }
          }}
        >
          <h4 id={`attachment-title-${r.id}`}>
            {es ? r.label_es : r.label_en}
          </h4>
          <p role="status">
            {pending && activeKind === r.id
              ? es
                ? "Cargando archivo…"
                : "Uploading file…"
              : documents.some((d) => d.kind === r.id)
                ? es
                  ? "Archivo cargado."
                  : "File uploaded."
                : es
                  ? "Pendiente de cargar."
                  : "Not yet uploaded."}
          </p>
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
            disabled={
              busy ||
              pending ||
              (r.id.startsWith(partnerLetterPrefix) && !ready)
            }
            label={es ? r.label_es : r.label_en}
          />
          {activeKind === r.id && (uploadError || localError) && (
            <p className="auth-error" role="alert">
              {uploadError || localError}
            </p>
          )}
          <button
            className="button secondary"
            disabled={
              busy ||
              pending ||
              (r.id.startsWith(partnerLetterPrefix) && !ready)
            }
            aria-busy={pending && activeKind === r.id}
          >
            <ActionLabel
              busy={pending && activeKind === r.id}
              pendingLabel={es ? "Guardando…" : "Saving…"}
            >
              {es ? "Guardar anexo" : "Save attachment"}
            </ActionLabel>
          </button>
        </form>
      ))}
      {!!unlinked.length && (
        <section aria-label={historyTitle}>
          <h4>{historyTitle}</h4>
          <p>
            {es
              ? "Estos archivos se conservan, pero no cuentan como carta de una organización actual. Si alguno corresponde a una carta de apoyo de una organización registrada, vuelva a cargarlo en su campo individual para vincularlo expresamente. No se han reasignado ni eliminado."
              : "These files are retained but do not count as a letter for a current organization. If a file is a letter of support from a registered organization, upload it in its individual field to explicitly link it. They have not been reassigned or deleted."}
          </p>
          {unlinked.map((d) => (
            <div className="document-row" key={d.id}>
              <span>{d.file_name}</span>
              <DocumentDownload href={`/files/${d.id}`} locale={locale}>
                {es ? "Descargar" : "Download"}
              </DocumentDownload>
            </div>
          ))}
        </section>
      )}
    </section>
  );
}
