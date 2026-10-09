"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/domain";
import { ActionLabel } from "./submit-button";
export function UploadForm({
  applicationId,
  locale,
  kind,
}: {
  applicationId: string;
  locale: Locale;
  kind: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const es = locale === "es";
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = new FormData(e.currentTarget);
      data.set("application_id", applicationId);
      data.set("kind", kind);
      const r = await fetch("/api/files", { method: "POST", body: data });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setError(
        es
          ? "No se pudo guardar el archivo. Revise formato, tamaño y permisos."
          : "Could not save the file. Check its format, size and permissions.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="live-form" onSubmit={upload}>
      <label>
        {es
          ? "Archivo: PDF, PNG, JPEG, DOCX o XLSX (máximo 4 MB)"
          : "File: PDF, PNG, JPEG, DOCX or XLSX (maximum 4 MB)"}
        <input
          type="file"
          name="file"
          accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
          required
        />
      </label>
      <button className="button secondary" disabled={busy} aria-busy={busy}>
        <ActionLabel
          busy={busy}
          pendingLabel={es ? "Adjuntando…" : "Uploading…"}
        >
          {es ? "Adjuntar archivo" : "Attach file"}
        </ActionLabel>
      </button>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </form>
  );
}
