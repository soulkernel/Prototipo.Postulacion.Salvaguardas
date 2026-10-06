"use client";
import { useState } from "react";
import type { Locale } from "@/lib/domain";

export function CorpusImport({ locale }: { locale: Locale }) {
  const es = locale === "es";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(form: FormData) {
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
      const items: unknown = JSON.parse(await file.text());
      if (!Array.isArray(items) || !items.length || items.length > 10000)
        throw new Error();
      for (let i = 0; i < items.length; i += 2) {
        setMessage(
          `${es ? "Procesando" : "Processing"} ${i + 1} / ${items.length}`,
        );
        const response = await fetch("/api/corpus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items.slice(i, i + 2)),
        });
        if (!response.ok) throw new Error();
      }
      setMessage(
        es
          ? "Carga completada. Fuentes pendientes de aprobación técnica."
          : "Import completed. Sources await technical approval.",
      );
    } catch {
      setMessage(
        es
          ? "Carga detenida. Puede volver a cargar el archivo; los fragmentos ya guardados no se duplicarán."
          : "Import stopped. Retry the file; saved chunks will not be duplicated.",
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
      <form action={submit} className="live-form">
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
        <button className="button primary" disabled={busy}>
          {es ? "Importar e indexar" : "Import and index"}
        </button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
