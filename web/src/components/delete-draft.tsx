"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDraft } from "@/app/applicant/actions";
import { ActionLabel } from "./submit-button";
import type { Locale } from "@/lib/domain";
export function DeleteDraft({
  id,
  revision,
  title,
  reference,
  category,
  locale,
  pending = false,
}: {
  id: string;
  revision: number;
  title: string;
  reference: string;
  category: string;
  locale: Locale;
  pending?: boolean;
}) {
  const es = locale === "es",
    router = useRouter(),
    dialog = useRef<HTMLDialogElement>(null),
    lock = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await deleteDraft(id, revision);
      if (!result.ok) {
        setError(
          result.error === "GLF_SUBMITTED_RECORD_PROTECTED"
            ? es
              ? "Este expediente ya fue enviado y no puede eliminarse."
              : "This application was submitted and cannot be deleted."
            : result.error === "GLF_REVISION_CONFLICT"
              ? es
                ? "El borrador cambió. Actualice la página antes de eliminarlo."
                : "The draft changed. Refresh before deleting it."
              : es
                ? "No se completó la eliminación. Puede volver a intentarlo; el borrador permanece bloqueado si la eliminación de archivos ya comenzó."
                : "Deletion was not completed. Retry; the draft remains locked if file deletion has started.",
        );
        return;
      }
      dialog.current?.close();
      router.replace("/applicant/applications?deleted=1");
      router.refresh();
    } catch {
      setError(
        es
          ? "No se pudo completar la eliminación. Revise su conexión y vuelva a intentarlo."
          : "Deletion failed. Check your connection and retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="button ghost danger-text"
        type="button"
        onClick={() => dialog.current?.showModal()}
      >
        {pending
          ? es
            ? "Completar eliminación"
            : "Complete deletion"
          : es
            ? "Eliminar borrador"
            : "Delete draft"}
      </button>
      <dialog
        ref={dialog}
        className="draft-delete-dialog"
        aria-labelledby={"delete-title-" + id}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <h2 id={"delete-title-" + id}>
          {es ? "¿Eliminar este borrador?" : "Delete this draft?"}
        </h2>
        <p>
          <strong>{title}</strong>
          <br />
          {reference} · {category}
        </p>
        <p>
          {es
            ? "Se eliminarán sus datos y archivos adjuntos. Esta acción no se puede deshacer. Compruebe que está eliminando la postulación correcta."
            : "Its data and attachments will be deleted. This action cannot be undone. Check that this is the correct application."}
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="live-actions">
          <button
            type="button"
            autoFocus
            className="button secondary"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            {es ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="button"
            className="button danger"
            disabled={busy}
            aria-busy={busy}
            onClick={remove}
          >
            <ActionLabel
              busy={busy}
              pendingLabel={es ? "Eliminando…" : "Deleting…"}
            >
              {es ? "Sí, eliminar borrador" : "Yes, delete draft"}
            </ActionLabel>
          </button>
        </div>
      </dialog>
    </>
  );
}
