import { defaultCall } from "@/lib/inbox-filters";
import { ModuleHeading } from "@/components/module-heading";
import { callThemeLabel } from "@/lib/call-themes";
import { DocumentDownload } from "@/components/document-download";
import Link from "@/components/feedback-link";
import Form from "next/form";
import { SubmitButton } from "@/components/submit-button";
import { requireReadViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ call?: string }>;
}) {
  const { db, profile } = await requireReadViewer([
    "grants_manager",
    "project_coordinator",
    "sustainability_reviewer",
    "committee_member",
    "administrator",
  ]);
  const locale = await getLocale();
  const es = locale === "es";
  const calls = await getCalls();
  const params = await searchParams;
  const preferred = defaultCall(calls);
  const id = calls.some((c) => c.id === params.call)
    ? params.call
    : preferred === "all"
      ? calls[0]?.id
      : preferred;
  const { data: report, error } = id
    ? await db.rpc(
        profile.access_kind === "academic"
          ? "academic_call_report"
          : "call_report",
        { requested_call: id },
      )
    : { data: null, error: null };
  if (error) throw new Error("Report unavailable");
  return (
    <Shell locale={locale} internal>
      <Link href="/internal">← {es ? "Panel interno" : "Staff workspace"}</Link>
      <ModuleHeading title={es ? "Reportería de cierre" : "Closing reports"}>
        <p>
          {es
            ? "Insumo interno para Comunicación. Selección, aprobación y firma se informan por separado. No incluye seguimiento de ejecución ni impactos alcanzados."
            : "Internal input for Communications. Selection, approval and signing are reported separately. It does not include implementation monitoring or achieved impacts."}
        </p>
      </ModuleHeading>
      <Form action="/internal/reports" className="live-actions">
        <label>
          {es ? "Convocatoria" : "Call"}{" "}
          <select name="call" defaultValue={id}>
            {calls.map((c) => (
              <option key={c.id} value={c.id}>
                {es ? c.title_es : c.title_en}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton
          className="button secondary"
          pendingLabel={es ? "Consultando…" : "Loading…"}
        >
          {es ? "Consultar" : "View"}
        </SubmitButton>
      </Form>
      {report && (
        <>
          <p>
            {es ? "Fecha de corte" : "Cut-off"}:{" "}
            {new Date(report.cutoff).toLocaleString(locale, {
              timeZone: "Pacific/Galapagos",
            })}
          </p>
          <div className="live-metrics">
            {[
              ["received", "Recibidas", "Received"],
              ["invited", "Invitadas a Fase 2", "Invited to Phase 2"],
              ["phase2_received", "Proyectos completos", "Full proposals"],
              ["approved", "Aprobadas", "Approved"],
              ["signed", "Convenios firmados", "Signed agreements"],
              ["not_selected", "No seleccionadas", "Not selected"],
            ].map(([key, esLabel, enLabel]) => (
              <div key={key}>
                {es ? esLabel : enLabel}
                <strong>{report[key]}</strong>
              </div>
            ))}
          </div>
          <section className="live-card">
            <h2>{es ? "Montos USD" : "Amounts USD"}</h2>
            <p>
              {es ? "Solicitado" : "Requested"}:{" "}
              {Number(report.requested_total).toLocaleString(locale)} ·{" "}
              {es ? "Aprobado" : "Approved"}:{" "}
              {Number(report.approved_total).toLocaleString(locale)} ·{" "}
              {es ? "Con convenio firmado" : "Under signed agreements"}:{" "}
              {Number(report.signed_total).toLocaleString(locale)}
            </p>
          </section>
          <section className="live-card">
            <h2>
              {es
                ? "Postulaciones recibidas por tema de aplicación"
                : "Received applications by application topic"}
            </h2>
            <ul>
              {report.by_type.map(
                (r: { project_type: string; received: number }) => (
                  <li key={r.project_type}>
                    {callThemeLabel(
                      r.project_type,
                      calls.find((c) => c.id === id)?.rules,
                      locale,
                    )}
                    : {r.received}
                  </li>
                ),
              )}
            </ul>
            <p>
              {es
                ? "Los indicadores sociales y ambientales permanecen como metas narrativas de cada expediente hasta que GLF apruebe sus definiciones y unidades de agregación."
                : "Social and environmental indicators remain narrative targets in each application until GLF approves their definitions and aggregation units."}
            </p>
          </section>
          <section className="live-card report-downloads">
            <h2>{es ? "Descargar reporte" : "Download report"}</h2>
            <p>
              {es
                ? "Descargue el reporte de la convocatoria seleccionada, con fecha y hora de corte de Galápagos."
                : "Download the selected call report with its Galapagos cut-off date and time."}
            </p>
            <div className="report-download-actions">
              <DocumentDownload
                className="button primary"
                href={"/internal/reports/export?call=" + id + "&format=xlsx"}
                locale={locale}
              >
                {es ? "Descargar Excel" : "Download Excel"}
              </DocumentDownload>
              <DocumentDownload
                className="button secondary"
                href={"/internal/reports/export?call=" + id + "&format=pdf"}
                locale={locale}
              >
                {es ? "Descargar PDF" : "Download PDF"}
              </DocumentDownload>
            </div>
            <details className="report-csv-option">
              <summary>
                {es ? "Otras opciones de exportación" : "Other export options"}
              </summary>
              <p>
                {es
                  ? "Para exportar datos a bases de datos o herramientas de análisis estadístico."
                  : "To export data to databases or statistical analysis tools."}
              </p>
              <DocumentDownload
                href={"/internal/reports/export?call=" + id + "&format=csv"}
                locale={locale}
              >
                {es ? "Exportar CSV" : "Export CSV"}
              </DocumentDownload>
            </details>
          </section>
        </>
      )}
    </Shell>
  );
}
