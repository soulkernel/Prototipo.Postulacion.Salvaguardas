"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { RemoveButton } from "./remove-button";
import { ActionLabel } from "./submit-button";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof RemoveButton>, "onClick" | "type"> & {
  locale: "es" | "en";
  element: string;
  consequence?: string;
  onConfirm: () => void | Promise<void>;
};

/** Opening never changes data; confirmed asynchronous removals finish before closing. */
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
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
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
          setError("");
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
              if (!locked.current) close();
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
                {error}
              </p>
            )}
            <div className="live-actions">
              <button
                type="button"
                className="button secondary"
                autoFocus
                disabled={pending}
                onClick={close}
              >
                {es ? "Cancelar" : "Cancel"}
              </button>
              <button
                type="button"
                className="button danger"
                disabled={pending}
                aria-busy={pending}
                aria-label={
                  pending
                    ? es
                      ? "Eliminando…"
                      : "Deleting…"
                    : es
                      ? "Eliminar"
                      : "Delete"
                }
                onClick={async () => {
                  if (locked.current || props.disabled) return;
                  locked.current = true;
                  setPending(true);
                  setError("");
                  try {
                    await onConfirm();
                    close();
                  } catch (cause) {
                    locked.current = false;
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : es
                          ? "No se pudo completar la eliminación. Inténtelo de nuevo."
                          : "Deletion could not be completed. Please try again.",
                    );
                  } finally {
                    setPending(false);
                  }
                }}
              >
                <ActionLabel
                  busy={pending}
                  pendingLabel={es ? "Eliminando…" : "Deleting…"}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {es ? "Eliminar" : "Delete"}
                </ActionLabel>
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
