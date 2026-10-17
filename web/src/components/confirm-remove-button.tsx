"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { RemoveButton } from "./remove-button";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof RemoveButton>, "onClick" | "type"> & {
  locale: "es" | "en";
  element: string;
  consequence?: string;
  onConfirm: () => void;
};

/** Opt-in confirmation for local application fields. Opening never changes form data. */
export function ConfirmRemoveButton({
  locale,
  element,
  consequence,
  onConfirm,
  ...props
}: Props) {
  const es = locale === "es";
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const locked = useRef(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <>
      <RemoveButton
        {...props}
        type="button"
        onClick={(event) => {
          event.preventDefault();
          trigger.current = event.currentTarget;
          locked.current = false;
          setError(false);
          setOpen(true);
        }}
      />
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className="draft-delete-dialog"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-element ${id}-description`}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClose={() => setOpen(false)}
          >
            <h2 id={`${id}-title`}>
              {es ? "¿Eliminar este elemento?" : "Delete this item?"}
            </h2>
            <p id={`${id}-element`} style={{ overflowWrap: "anywhere" }}>
              <strong>{element}</strong>
            </p>
            <p id={`${id}-description`}>
              {consequence ||
                (es
                  ? "Se eliminará la información ingresada en este elemento."
                  : "The information entered in this item will be deleted.")}{" "}
              {es
                ? "Esta acción no se puede deshacer."
                : "This action cannot be undone."}
            </p>
            {error && (
              <p role="alert" className="error">
                {es
                  ? "No se pudo completar la eliminación. Revise los datos e inténtelo de nuevo."
                  : "Deletion could not be completed. Check the data and try again."}
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
                className="button danger"
                onClick={() => {
                  if (locked.current || props.disabled) return;
                  locked.current = true;
                  try {
                    onConfirm();
                    close();
                  } catch {
                    locked.current = false;
                    setError(true);
                  }
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
                {es ? "Eliminar" : "Delete"}
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
