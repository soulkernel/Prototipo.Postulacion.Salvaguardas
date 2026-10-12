"use client";
import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { ActionLabel } from "./submit-button";
import type { Locale } from "@/lib/domain";

export function DocumentDownload({
  href,
  locale,
  children,
}: {
  href: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const flight = useRef(false);
  async function download() {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/pdf")
      )
        throw new Error("Download unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        response.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] || "GLF.pdf";
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
      <button
        type="button"
        className="button secondary"
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
