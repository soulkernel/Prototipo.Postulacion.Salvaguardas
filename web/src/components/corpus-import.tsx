"use client";
import { ActionLabel } from "./submit-button";
import { useRef, useState, type FormEvent } from "react";
import { sendCorpusBatch } from "@/lib/corpus-upload";
import type { Locale } from "@/lib/domain";

export function CorpusImport({ locale }: { locale: Locale }) {
  const es = locale === "es";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const checkpoint = useRef({ hash: "", offset: 0 });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("corpus");
    if (!(file instanceof File) || file.size > 10000000) {
      setMessage(
        es
          ? "Seleccione un JSON de hasta 10 MB."
          : "Select a JSON file up to 10 MB.",
      );
      return;
    }
    setBusy(true);
    try {
      const raw = await file.text();
      const items: unknown = JSON.parse(raw);
      if (!Array.isArray(items) || !items.length || items.length > 10000)
        throw new Error();
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)),
        ),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      if (checkpoint.current.hash !== hash)
        checkpoint.current = { hash, offset: 0 };
      for (let i = checkpoint.current.offset; i < items.length; i += 2) {
        setMessage(
          `${es ? "Procesando" : "Processing"} ${i + 1} / ${items.length}`,
        );
        await sendCorpusBatch(items.slice(i, i + 2));
        checkpoint.current.offset = Math.min(i + 2, items.length);
      }
      setMessage(
        es
          ? "Carga completada. Fuentes pendientes de aprobación técnica."
          : "Import completed. Sources await technical approval.",
      );
    } catch (error) {
      const code =
        error instanceof Error &&
        /^(GLF_|HTTP_|NETWORK)[A-Z0-9_]*$/.test(error.message)
          ? error.message
          : "INVALID_FILE";
      setMessage(
        (es
          ? `Carga pausada en el fragmento ${checkpoint.current.offset + 1}. Pulse Importar para reanudar. Los fragmentos guardados no se duplicarán.`
          : `Import paused at chunk ${checkpoint.current.offset + 1}. Click Import to resume. Saved chunks will not be duplicated.`) +
          ` (${code})`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="live-card">
      <h2>{es ? "Importar corpus normativo" : "Import normative corpus"}</h2>
      <p>
        {es
          ? "Solo fuentes normativas. No cargue expedientes ni datos personales. La carga no aprueba las fuentes para búsqueda."
          : "Normative sources only. Do not upload applications or personal data. Import does not approve sources for search."}
      </p>
      <form onSubmit={submit} className="live-form">
        <label>
          {es
            ? "Archivo preparado del corpus (JSON)"
            : "Prepared corpus file (JSON)"}
          <input
            name="corpus"
            type="file"
            accept=".json,application/json"
            required
            disabled={busy}
          />
        </label>
        <button className="button primary" disabled={busy} aria-busy={busy}>
          <ActionLabel
            busy={busy}
            pendingLabel={
              es ? "Importando e indexando…" : "Importing and indexing…"
            }
          >
            {es ? "Importar e indexar" : "Import and index"}
          </ActionLabel>
        </button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
