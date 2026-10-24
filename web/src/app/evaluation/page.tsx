import { redirect } from "next/navigation";
import { getViewer, requireViewer, getCalls } from "@/lib/data";
import Link from "@/components/feedback-link";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { CallPreview } from "@/components/call-preview";
import { DocumentDownload } from "@/components/document-download";
import { statusLabel } from "@/lib/fields";
export default async function EvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.profile.access_kind !== "academic")
    await requireViewer(["administrator"]);
  const locale = await getLocale(),
    es = locale === "es";
  const view = (await searchParams).view;
  if (!["workflow", "files", "calls"].includes(view || ""))
    redirect("/internal/evidence");
  const steps = es
    ? [
        [
          "1. Convocatoria y categoría",
          "El GLF publica fechas, prioridades, categorías y anexos. Pequeña: hasta USD 100.000 y 12 meses; mediana: hasta USD 250.000 y 24 meses; grande: desde USD 250.000 y 36 meses. El cofinanciamiento mínimo es 10% para mediana y 25% para grande.",
        ],
        [
          "2. Nota conceptual",
          "El postulante consigna proponente, presupuesto, ubicación, descripción, objetivos y alineación estratégica, resultados, indicadores, beneficiarios, sostenibilidad, actividades y riesgos. Puede guardar y retomar un borrador.",
        ],
        [
          "3. Screening ambiental y social",
          "Cada actividad se relaciona con sus objetivos y riesgos. Se califican probabilidad y gravedad; su producto determina el puntaje. En esta fase no se exigen medidas, costos ni responsables de mitigación.",
        ],
        [
          "4. Firma y presentación",
          "Se generan la nota conceptual y la evaluación ambiental y social en PDF. El postulante firma electrónicamente ambos archivos, los carga y envía. Se emite comprobante y el envío queda bloqueado para edición libre.",
        ],
        [
          "5. Revisión y apoyo RAG",
          "El personal revisa los expedientes recibidos. E5 recupera evidencia normativa; BM25 + Qwen propone una respuesta con citas. La decisión corresponde al GLF, no a los modelos.",
        ],
        [
          "6. Propuesta completa, decisión y convenio",
          "Solo los preseleccionados presentan la propuesta completa, la matriz integral y el PGAS. La selección, aprobación y firma del convenio son hitos diferentes. Los reportes consolidan resultados del proceso; el seguimiento de ejecución es otra etapa.",
        ],
      ]
    : [
        [
          "1. Call and category",
          "GLF publishes dates, priorities, categories and attachments. Small: up to USD 100,000 / 12 months; medium: up to USD 250,000 / 24 months; large: from USD 250,000 / 36 months. Minimum cofinancing: medium 10%, large 25%.",
        ],
        [
          "2. Concept note",
          "Applicants enter proponent, budget, location, description, objectives, strategic alignment, results, indicators, beneficiaries, sustainability, activities and risks. Drafts can be saved and resumed.",
        ],
        [
          "3. Environmental and social screening",
          "Activities connect to objectives and risks. Probability multiplied by severity gives the risk score. Mitigation measures, costs and responsibilities are requested in phase two.",
        ],
        [
          "4. Signature and submission",
          "Applicants generate, electronically sign and upload the concept note and assessment PDFs. Submission produces a receipt and locks unrestricted editing.",
        ],
        [
          "5. Review and RAG support",
          "E5 retrieves regulatory evidence. BM25 + Qwen proposes an answer with citations. GLF staff retain decision authority.",
        ],
        [
          "6. Full proposal, decision and agreement",
          "Shortlisted applicants submit a full proposal and environmental and social management plan. Selection, approval and agreement signature are distinct milestones. Reports summarize the application process.",
        ],
      ];

  const calls = view === "calls" ? await getCalls() : [];
  const { data: apps, error: appsError } =
    view === "files"
      ? await viewer.db
          .from("applications")
          .select("id,reference_code,status,payload")
          .order("updated_at", { ascending: false })
      : { data: [], error: null };
  const { data: docs, error: docsError } =
    view === "files"
      ? await viewer.db
          .from("application_documents")
          .select("id,application_id,file_name")
          .order("file_name")
      : { data: [], error: null };
  if (appsError || docsError) throw new Error("Academic files unavailable");
  return (
    <Shell locale={locale} internal>
      <h1>
        {view === "files"
          ? es
            ? "Expedientes y archivos"
            : "Applications and files"
          : view === "calls"
            ? es
              ? "Convocatorias"
              : "Calls"
            : es
              ? "Recorrido del portal"
              : "Portal walkthrough"}
      </h1>
      <p>
        {es
          ? "Consulta académica de los expedientes de prueba habilitados. Puede revisar formularios y descargar los documentos disponibles."
          : "Academic review of enabled test applications. Browse forms and download available documents."}
      </p>
      <nav className="live-nav">
        <Link href="/internal/evidence">
          {es ? "Asistente RAG" : "RAG assistant"}
        </Link>
        <Link href="/evaluation?view=files">
          {es ? "Expedientes y archivos" : "Applications and files"}
        </Link>
        <Link href="/evaluation?view=calls">
          {es ? "Convocatorias" : "Calls"}
        </Link>
        <Link href="/internal/reports">{es ? "Reportes" : "Reports"}</Link>
        <Link href="/evaluation?view=workflow">
          {es ? "Recorrido del portal" : "Portal walkthrough"}
        </Link>
      </nav>
      {view === "workflow" && (
        <section className="live-card">
          <h2>{es ? "Ciclo de postulación" : "Application lifecycle"}</h2>
          {steps.map(([title, description]) => (
            <details key={title}>
              <summary>{title}</summary>
              <p>{description}</p>
            </details>
          ))}
        </section>
      )}
      {view === "calls" &&
        calls.map((c) => (
          <section className="live-card" key={c.id}>
            <CallPreview call={c} locale={locale} />
          </section>
        ))}
      {view === "files" && (
        <>
          <p>
            {apps?.length || 0}{" "}
            {es ? "expedientes disponibles" : "available applications"}
          </p>
          {apps?.map((a) => (
            <section className="live-card" key={a.id}>
              <h2>{a.payload?.concept?.title || a.reference_code}</h2>
              <p>
                {a.reference_code} · {statusLabel(a.status, locale)}
              </p>
              <div className="live-actions">
                <Link
                  className="button secondary"
                  href={`/internal/applications/${a.id}`}
                >
                  {es ? "Ver expediente" : "View application"}
                </Link>
                <Link className="button secondary" href={`/applicant/${a.id}`}>
                  {es ? "Consultar formulario completo" : "View complete form"}
                </Link>
              </div>
              <h3>{es ? "Archivos disponibles" : "Available files"}</h3>
              {docs?.filter((d) => d.application_id === a.id).length ? (
                docs
                  .filter((d) => d.application_id === a.id)
                  .map((d) => (
                    <div className="document-row" key={d.id}>
                      <span>{d.file_name}</span>
                      <DocumentDownload href={`/files/${d.id}`} locale={locale}>
                        {es ? "Descargar" : "Download"}
                      </DocumentDownload>
                    </div>
                  ))
              ) : (
                <p>
                  {es
                    ? "No hay archivos cargados en este expediente. Los PDF generados y comprobantes, si existen, están en Ver expediente o en el formulario completo."
                    : "No files are uploaded for this application. Generated PDFs and receipts, when available, can be accessed in the application or complete form."}
                </p>
              )}
            </section>
          ))}
        </>
      )}
    </Shell>
  );
}
