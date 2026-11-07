"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionLabel } from "./submit-button";
import type { Locale } from "@/lib/domain";

export function ReceiptDownload({
  id,
  locale,
  automatic = false,
  legacy = false,
}: {
  id: string;
  locale: Locale;
  automatic?: boolean;
  legacy?: boolean;
}) {
  const [language, setLanguage] = useState(locale);
  const [updated, setUpdated] = useState(legacy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const flight = useRef(false);
  const started = useRef(false);
  const es = locale === "es";
  const download = useCallback(async () => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(
        `/receipts/${id}?lang=${language}${legacy && updated ? "&view=updated" : ""}`,
      );
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/pdf")
      )
        throw new Error("Receipt unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        response.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] || `GLF-REC-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Retain the object URL briefly so the browser can consume the download.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError(true);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }, [id, language, legacy, updated]);
  useEffect(() => {
    if (automatic && !started.current) {
      started.current = true;
      void download();
    }
  }, [automatic, download]);
  return (
    <div className="document-download-control">
      {legacy && (
        <label className="download-language">
          {es ? "Presentación del comprobante" : "Receipt presentation"}
          <select
            disabled={busy}
            value={updated ? "updated" : "original"}
            onChange={(event) => setUpdated(event.target.value === "updated")}
          >
            <option value="updated">
              {es ? "Copia de consulta actualizada" : "Updated reference copy"}
            </option>
            <option value="original">
              {es ? "Formato original" : "Original format"}
            </option>
          </select>
        </label>
      )}
      <label className="download-language">
        {es ? "Idioma del comprobante" : "Receipt language"}
        <select
          disabled={busy}
          value={language}
          onChange={(e) => setLanguage(e.target.value as Locale)}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </label>
      <button
        type="button"
        className="button secondary"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void download()}
      >
        <ActionLabel
          busy={busy}
          pendingLabel={es ? "Generando comprobante…" : "Generating receipt…"}
        >
          {es
            ? "Descargar comprobante de recepción"
            : "Download submission receipt"}
        </ActionLabel>
      </button>
      {error && (
        <p role="alert">
          {es
            ? "La postulación ya está recibida. No se pudo descargar el comprobante; inténtelo nuevamente desde este botón."
            : "Your application has been received. The receipt could not be downloaded; please try this button again."}
        </p>
      )}
    </div>
  );
}
