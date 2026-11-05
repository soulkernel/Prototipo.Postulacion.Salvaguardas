"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adjustNarrativeLineBreaks } from "../lib/narrative-editing";
import { TextLimitCounter } from "./text-limit-counter";

/** Plain-text entry. Previewing never calls onChange or starts an autosave. */
export function NarrativeTextarea({
  id,
  label,
  value,
  onChange,
  locale,
  invalid,
  descriptionId,
  placeholder,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale: "es" | "en";
  invalid?: boolean;
  descriptionId?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const es = locale === "es";
  const maxLength = 12000;
  const uid = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const autoHeight = useRef("");
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const applied = useRef(false);
  const [preview, setPreview] = useState<{
    original: string;
    adjusted: string;
  } | null>(null);
  const adjusted = adjustNarrativeLineBreaks(value);

  useEffect(() => {
    const node = textarea.current;
    if (!node) return;
    // Fit the content up to 400px, unless the applicant has resized manually.
    const grow = () => {
      if (!node.clientWidth || node.style.height !== autoHeight.current) return;
      node.style.height = "auto";
      autoHeight.current = `${Math.min(Math.max(node.scrollHeight + 2, 190), 400)}px`;
      node.style.height = autoHeight.current;
    };
    grow();
    let width = node.clientWidth;
    const observer = new ResizeObserver(() => {
      if (node.clientWidth !== width) {
        width = node.clientWidth;
        grow();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (preview) dialog.current?.showModal();
  }, [preview]);

  function close() {
    dialog.current?.close();
    setPreview(null);
    if (applied.current) {
      requestAnimationFrame(() => textarea.current?.focus());
    } else {
      trigger.current?.focus();
    }
  }

  return (
    <div className="narrative-entry">
      <textarea
        ref={textarea}
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="narrative-entry-text"
        rows={7}
        wrap="soft"
        maxLength={maxLength}
        spellCheck
        lang={locale}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={`${uid}-count${descriptionId ? ` ${descriptionId}` : ""}`}
        disabled={disabled}
      />
      <div className="narrative-entry-tools">
        <TextLimitCounter
          id={`${uid}-count`}
          count={value.length}
          limit={maxLength}
          locale={locale}
        />
        {adjusted !== value && value.trim() && (
          <button
            ref={trigger}
            type="button"
            className="narrative-adjust-button"
            aria-haspopup="dialog"
            aria-label={
              es
                ? `Ajustar saltos de línea: ${label}`
                : `Adjust line breaks: ${label}`
            }
            disabled={disabled}
            onClick={() => {
              applied.current = false;
              setPreview({ original: value, adjusted });
            }}
          >
            {es ? "Ajustar saltos de línea" : "Adjust line breaks"}
          </button>
        )}
      </div>
      {preview &&
        createPortal(
          <dialog
            ref={dialog}
            className="draft-delete-dialog narrative-adjust-dialog"
            aria-labelledby={`${uid}-title`}
            aria-describedby={`${uid}-description`}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClose={() => setPreview(null)}
          >
            <h2 id={`${uid}-title`}>
              {es ? "Revisar saltos de línea" : "Review line breaks"}
            </h2>
            <p>
              <strong>{label}</strong>
            </p>
            <p id={`${uid}-description`}>
              {es
                ? "Compare ambos textos. Se propone unir líneas largas y reducir líneas vacías. Algunos cortes pueden ser intencionales: aplique el ajuste solo si conserva la organización que necesita. Su borrador no cambia hasta pulsar Aplicar."
                : "Compare both texts. This suggests joining long lines and reducing blank lines. Some breaks may be intentional: apply only if the organization remains appropriate. Your draft does not change until you select Apply."}
            </p>
            <div className="narrative-preview-grid">
              <div className="narrative-preview-field">
                <label htmlFor={`${uid}-original`}>
                  {es ? "Texto actual" : "Current text"}
                </label>
                <textarea
                  id={`${uid}-original`}
                  value={preview.original}
                  readOnly
                  rows={10}
                />
              </div>
              <div className="narrative-preview-field">
                <label htmlFor={`${uid}-adjusted`}>
                  {es ? "Vista previa del ajuste" : "Adjustment preview"}
                </label>
                <textarea
                  id={`${uid}-adjusted`}
                  value={preview.adjusted}
                  readOnly
                  rows={10}
                />
              </div>
            </div>
            {value !== preview.original && (
              <p role="alert">
                {es
                  ? "El texto cambió. Cierre y vuelva a revisar el ajuste."
                  : "The text changed. Close and review the adjustment again."}
              </p>
            )}
            <div className="live-actions">
              <button
                type="button"
                className="button secondary"
                autoFocus
                onClick={close}
              >
                {es ? "Cancelar" : "Cancel"}
              </button>
              <button
                type="button"
                className="button"
                disabled={disabled || value !== preview.original}
                onClick={() => {
                  if (
                    applied.current ||
                    textarea.current?.matches(":disabled") ||
                    value !== preview.original
                  )
                    return;
                  applied.current = true;
                  onChange(preview.adjusted);
                  close();
                }}
              >
                {es ? "Aplicar" : "Apply"}
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </div>
  );
}
