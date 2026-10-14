"use client";
import { useState } from "react";
import {
  attachmentFormats,
  attachmentConditions,
  conditionLabel,
  type AttachmentRequirement,
} from "@/lib/attachment-requirements";
import type { Locale } from "@/lib/domain";

export function CallAttachmentEditor({
  initial,
  locale,
  onEdit,
}: {
  initial: AttachmentRequirement[];
  locale: Locale;
  onEdit: () => void;
}) {
  const es = locale === "es";
  const [rows, setRows] = useState(initial);
  function update(id: string, patch: Partial<AttachmentRequirement>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    onEdit();
  }
  return (
    <section className="call-attachment-editor">
      <h3>{es ? "Anexos obligatorios" : "Required attachments"}</h3>
      <p className="field-help">
        {es
          ? "En la fase de nota conceptual siempre se solicitan los dos PDF firmados: nota conceptual y evaluación A&S. Agregue aquí los anexos adicionales y sus requisitos."
          : "The concept-note phase always requires both signed PDFs: concept note and E&S assessment. Add any additional attachments and their requirements here."}
      </p>
      <input
        type="hidden"
        name="attachment_requirements"
        value={JSON.stringify(rows)}
      />
      {rows.map((r, i) => {
        const fixed = ["concept_signed", "matrix_signed"].includes(r.id);
        return (
          <section className="call-attachment-card" key={r.id}>
            <header>
              <h4>
                {es ? "Anexo" : "Attachment"} {i + 1}
              </h4>
              {!fixed && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setRows(rows.filter((x) => x.id !== r.id));
                    onEdit();
                  }}
                  aria-label={`${es ? "Quitar anexo" : "Remove attachment"} ${i + 1}`}
                >
                  {es ? "Quitar" : "Remove"}
                </button>
              )}
            </header>
            <div className="live-grid">
              <label>
                {es
                  ? "Nombre del documento en español *"
                  : "Document name in Spanish *"}
                <input
                  value={r.label_es}
                  maxLength={200}
                  lang="es"
                  spellCheck
                  disabled={fixed}
                  onChange={(e) => update(r.id, { label_es: e.target.value })}
                />
              </label>
              <label>
                {es
                  ? "Nombre del documento en inglés *"
                  : "Document name in English *"}
                <input
                  value={r.label_en}
                  maxLength={200}
                  lang="en"
                  spellCheck
                  disabled={fixed}
                  onChange={(e) => update(r.id, { label_en: e.target.value })}
                />
              </label>
            </div>
            <fieldset className="attachment-format-options" disabled={fixed}>
              <h3 className="section-card-title">
                {es ? "Formatos admitidos *" : "Accepted formats *"}
              </h3>
              {attachmentFormats.map((f) => (
                <label className="check-row" key={f}>
                  <input
                    type="checkbox"
                    checked={r.formats.includes(f)}
                    disabled={
                      r.conditions.includes("electronic_signature") &&
                      f !== "pdf"
                    }
                    onChange={(e) =>
                      update(r.id, {
                        formats: e.target.checked
                          ? [...r.formats, f]
                          : r.formats.filter((x) => x !== f),
                      })
                    }
                  />
                  {f.toUpperCase()}
                </label>
              ))}
            </fieldset>
            <fieldset disabled={fixed}>
              <h3 className="section-card-title">
                {es ? "Condiciones de presentación" : "Presentation conditions"}
              </h3>
              {attachmentConditions.map((c) => (
                <label className="check-row" key={c}>
                  <input
                    type="checkbox"
                    checked={r.conditions.includes(c)}
                    onChange={(e) =>
                      update(r.id, {
                        conditions: e.target.checked
                          ? [...r.conditions, c]
                          : r.conditions.filter((x) => x !== c),
                        ...(c === "electronic_signature" && e.target.checked
                          ? { formats: ["pdf"] }
                          : {}),
                      })
                    }
                  />
                  {conditionLabel(c, es)}
                </label>
              ))}
            </fieldset>
            <div className="live-grid">
              <label>
                {es
                  ? "Instrucciones adicionales en español"
                  : "Additional instructions in Spanish"}
                <textarea
                  value={r.instructions_es}
                  maxLength={2000}
                  lang="es"
                  spellCheck
                  onChange={(e) =>
                    update(r.id, { instructions_es: e.target.value })
                  }
                />
              </label>
              <label>
                {es
                  ? "Instrucciones adicionales en inglés"
                  : "Additional instructions in English"}
                <textarea
                  value={r.instructions_en}
                  maxLength={2000}
                  lang="en"
                  spellCheck
                  onChange={(e) =>
                    update(r.id, { instructions_en: e.target.value })
                  }
                />
              </label>
            </div>
            <small>
              {es
                ? "La firma electrónica requiere PDF. La autenticidad de la firma y la notarización serán revisadas por GLF. Si elige otra condición, descríbala en ambos idiomas."
                : "Electronic signatures require PDF. GLF will review signature authenticity and notarization. Describe any other condition in both languages."}
            </small>
          </section>
        );
      })}
      <button
        type="button"
        className="button secondary"
        disabled={rows.length >= 30}
        onClick={() => {
          setRows([
            ...rows,
            {
              id: `attachment_${crypto.randomUUID()}`,
              label_es: "",
              label_en: "",
              formats: ["pdf"],
              conditions: [],
              instructions_es: "",
              instructions_en: "",
            },
          ]);
          onEdit();
        }}
      >
        + {es ? "Agregar anexo" : "Add attachment"}
      </button>
    </section>
  );
}
