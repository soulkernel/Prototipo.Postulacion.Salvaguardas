"use client";
import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { ActionLabel } from "./submit-button";
import type { Locale } from "@/lib/domain";

export function DocumentDownload({
  href,
  locale,
  children,
  className = "button secondary",
  fileName,
  languageSelection = false,
}: {
  href: string;
  locale: Locale;
  children: React.ReactNode;
  className?: string;
  fileName?: string;
  languageSelection?: boolean;
}) {
  const [language, setLanguage] = useState(locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const flight = useRef(false);
  async function download() {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError(false);
    try {
      const target = new URL(href, window.location.origin);
      if (languageSelection) target.searchParams.set("lang", language);
      const response = await fetch(target.toString(), { cache: "no-store" });
      if (
        !response.ok ||
        /text\/html|application\/json/.test(
          response.headers.get("content-type") || "",
        )
      )
        throw new Error("Download unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        response.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ||
        fileName ||
        "GLF.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError(true);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="document-download-control">
      {languageSelection && (
        <label className="download-language">
          {locale === "es" ? "Idioma del reporte" : "Report language"}
          <select
            disabled={busy}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Locale)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
      )}
      <button
        type="button"
        className={className}
        disabled={busy}
        aria-busy={busy}
        onClick={() => void download()}
      >
        {!busy && <FileDown size={17} aria-hidden="true" />}
        <ActionLabel
          busy={busy}
          pendingLabel={locale === "es" ? "Procesando…" : "Processing…"}
        >
          {children}
        </ActionLabel>
      </button>
      {error && (
        <p role="alert">
          {locale === "es"
            ? "No se pudo descargar el documento. Inténtelo nuevamente."
            : "The document could not be downloaded. Please try again."}
        </p>
      )}
    </div>
  );
}
