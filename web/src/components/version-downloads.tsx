"use client";
import { useId, useState } from "react";
import { DocumentDownload } from "./document-download";
import type { Locale } from "@/lib/domain";

export function VersionDownloads({
  id,
  stage,
  locale,
  prepared = false,
  legacy = false,
}: {
  id: string;
  stage: number;
  locale: Locale;
  prepared?: boolean;
  legacy?: boolean;
}) {
  const [language, setLanguage] = useState<Locale>(locale);
  const [updated, setUpdated] = useState(legacy);
  const controlId = useId();
  const es = locale === "es";
  const query = new URLSearchParams({ lang: language });
  if (prepared) query.set("prepared", "1");
  else if (legacy && updated) query.set("view", "updated");
  return (
    <div className="version-downloads">
      <div className="download-options">
        <label htmlFor={controlId}>
          {es ? "Idioma del documento" : "Document language"}
          <select
            id={controlId}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Locale)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        {legacy && !prepared && (
          <label>
            {es ? "Presentación del PDF" : "PDF presentation"}
            <select
              value={updated ? "updated" : "original"}
              onChange={(e) => setUpdated(e.target.value === "updated")}
            >
              <option value="updated">
                {es
                  ? "Copia de consulta actualizada"
                  : "Updated reference copy"}
              </option>
              <option value="original">
                {es ? "Formato original" : "Original format"}
              </option>
            </select>
          </label>
        )}
      </div>
      <p className="field-help">
        {es
          ? "El idioma cambia los títulos y las etiquetas. Las respuestas conservan el idioma en que fueron ingresadas; los archivos firmados se descargan por separado."
          : "The language changes headings and labels. Responses retain their original language; signed files are downloaded separately."}
      </p>
      <div className="report-download-actions">
        {!prepared && (
          <DocumentDownload
            href={`/receipts/${id}?lang=${language}`}
            locale={locale}
          >
            {es
              ? "Descargar comprobante de recepción"
              : "Download submission receipt"}
          </DocumentDownload>
        )}
        <DocumentDownload
          href={`/documents/${id}/concept?${query}`}
          locale={locale}
        >
          {stage === 1
            ? es
              ? "Nota conceptual PDF"
              : "Concept note PDF"
            : es
              ? "Propuesta completa PDF"
              : "Full proposal PDF"}
        </DocumentDownload>
        <DocumentDownload
          href={`/documents/${id}/matrix?${query}`}
          locale={locale}
        >
          {es
            ? "Evaluación ambiental y social PDF"
            : "Environmental and social assessment PDF"}
        </DocumentDownload>
      </div>
    </div>
  );
}
