"use client";
import { useRef, useState } from "react";
import { ActionLabel } from "./submit-button";
import type { Locale } from "@/lib/domain";

export function SignedDocumentUpload({
  kind,
  title,
  locale,
  document,
  current,
  editable,
  ready,
  busy,
  onUpload,
}: {
  kind: string;
  title: string;
  locale: Locale;
  document?: { id: string; file_name: string };
  current: boolean;
  editable: boolean;
  ready: boolean;
  busy: boolean;
  onUpload: (form: HTMLFormElement) => Promise<void>;
}) {
  const es = locale === "es";
  const formRef = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <section className="signed-document-card" aria-label={title}>
      <h3>{title}</h3>
      {document ? (
        <div className="document-row">
          <span>
            {document.file_name}
            <br />
            <span role="status">
              {current
                ? es
                  ? "Cargado · pendiente de verificación de firma"
                  : "Uploaded · signature verification pending"
                : es
                  ? "Documento de una versión anterior · requiere reemplazo"
                  : "Document from an earlier version · replacement required"}
            </span>
          </span>
          <a className="button secondary" href={`/files/${document.id}`}>
            {es ? "Descargar" : "Download"}
          </a>
        </div>
      ) : (
        <p className="field-help">
          {es ? "Pendiente de cargar." : "Not uploaded yet."}
        </p>
      )}
      {editable && (
        <form
          ref={formRef}
          className="live-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy && ready) setConfirming(true);
          }}
        >
          <input type="hidden" name="kind" value={kind} />
          <label>
            {document
              ? es
                ? "Reemplazar con un PDF firmado (máximo 4 MB)"
                : "Replace with a signed PDF (maximum 4 MB)"
              : es
                ? "PDF firmado electrónicamente (máximo 4 MB)"
                : "Electronically signed PDF (maximum 4 MB)"}
            <input
              type="file"
              name="file"
              accept=".pdf,application/pdf"
              required
              disabled={busy || !ready}
              onChange={() => setConfirming(false)}
            />
          </label>
          {!ready && (
            <p className="field-help">
              {es
                ? "Guarde los cambios y prepare los documentos de la versión vigente antes de cargarlos."
                : "Save your changes and prepare the current version before uploading documents."}
            </p>
          )}
          {!confirming ? (
            <button className="button secondary" disabled={busy || !ready}>
              {es ? "Guardar documento" : "Save document"}
            </button>
          ) : (
            <div className="signature-warning" role="alert">
              <p>
                {es
                  ? "Este documento debe contar con una firma electrónica válida. Cargar un PDF sin firma, podría no cumplir los requisitos de presentación. La validez de la firma será revisada por el GLF."
                  : "This document must carry a valid electronic signature. Uploading an unsigned PDF may not meet the submission requirements. GLF will review the validity of the signature."}
              </p>
              <div className="live-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  {es ? "Revisar archivo" : "Review file"}
                </button>
                <button
                  type="button"
                  className="button dark"
                  disabled={busy || !ready}
                  aria-busy={saving}
                  onClick={async () => {
                    if (!formRef.current || busy || !ready) return;
                    setSaving(true);
                    try {
                      await onUpload(formRef.current);
                    } finally {
                      setSaving(false);
                      setConfirming(false);
                    }
                  }}
                >
                  <ActionLabel
                    busy={saving}
                    pendingLabel={
                      es ? "Guardando documento…" : "Saving document…"
                    }
                  >
                    {es ? "Continuar y guardar" : "Continue and save"}
                  </ActionLabel>
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
