"use client";
import { useId, useState } from "react";
import type { Locale } from "@/lib/domain";
import { DocumentDownload } from "./document-download";

export function ReportDownloads({ callId, locale }: { callId: string; locale: Locale }) {
  const [language, setLanguage] = useState<Locale>(locale);
  const id = useId();
  const es = locale === "es";
  const href = (format: string) => "/internal/reports/export?" + new URLSearchParams({ call: callId, format, lang: language });
  return <>
    <label className="download-language" htmlFor={id}>{es ? "Idioma del reporte" : "Report language"}
      <select id={id} value={language} onChange={e => setLanguage(e.target.value as Locale)}>
        <option value="es">Español</option><option value="en">English</option>
      </select>
    </label>
    <div className="report-download-actions">
      <DocumentDownload href={href("xlsx")} locale={locale} className="button primary">{es ? "Descargar Excel" : "Download Excel"}</DocumentDownload>
      <DocumentDownload href={href("pdf")} locale={locale}>{es ? "Descargar PDF" : "Download PDF"}</DocumentDownload>
    </div>
    <details className="report-csv-option"><summary>{es ? "Otras opciones de exportación" : "Other export options"}</summary>
      <p>{es ? "Para exportar datos a bases de datos o herramientas de análisis estadístico." : "Export data to databases or statistical analysis tools."}</p>
      <DocumentDownload href={href("csv")} locale={locale}>{es ? "Exportar CSV" : "Export CSV"}</DocumentDownload>
    </details>
  </>;
}
