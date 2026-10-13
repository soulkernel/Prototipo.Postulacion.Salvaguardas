import { redirect } from "next/navigation";
import { getViewer, requireViewer } from "@/lib/data";
import Link from "@/components/feedback-link";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { RagWorkspace } from "@/components/rag-workspace";
import { ragConfigured } from "@/lib/rag";
import { qwenConfigured } from "@/lib/qwen";
import { evaluationProjects } from "@/lib/evaluation-projects";
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
  const workflow = (await searchParams).view === "workflow";
  const projects = evaluationProjects(es);
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
  return (
    <Shell locale={locale} internal>
      <h1>
        {es
          ? workflow
            ? "Recorrido del portal"
            : "Asistente RAG · evaluación académica"
          : workflow
            ? "Portal walkthrough"
            : "RAG assistant · academic evaluation"}
      </h1>
      <p>
        {es
          ? "Acceso de evaluación con ejemplos independientes de los expedientes institucionales."
          : "Evaluation access using examples independent of institutional applications."}{" "}
        {viewer.profile.access_expires_at && (
          <>
            {es ? "Vigente hasta: " : "Valid until: "}
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "long",
              timeZone: "Pacific/Galapagos",
            }).format(new Date(viewer.profile.access_expires_at))}
            .
          </>
        )}
      </p>
      <nav className="live-nav">
        <Link href="/evaluation">{es ? "Asistente RAG" : "RAG assistant"}</Link>
        <Link href="/evaluation?view=workflow">
          {es ? "Recorrido del portal" : "Portal walkthrough"}
        </Link>
      </nav>
      {workflow ? (
        <>
          <section className="live-card">
            <h2>{es ? "Ciclo de postulación" : "Application lifecycle"}</h2>
            {steps.map(([title, description]) => (
              <details key={title}>
                <summary>{title}</summary>
                <p>{description}</p>
              </details>
            ))}
          </section>
          <section className="live-card">
            <h2>
              {es ? "Escenarios para probar el RAG" : "RAG test scenarios"}
            </h2>
            {projects.map((p) => (
              <article key={p.id}>
                <h3>
                  {p.reference} · {p.title}
                </h3>
                <p>
                  {es ? "Fase" : "Phase"} {p.stage}
                </p>
                <ul>
                  {p.risks.map((r) => (
                    <li key={r.id}>
                      {r.name}: {r.probability} × {r.severity} = {r.score}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </>
      ) : (
        <>
          <p>
            {es
              ? "Seleccione un ejemplo y un riesgo, o Consulta libre. Pruebe ambos motores y contraste sus fuentes. Límite del acceso académico: 15 consultas por hora y 60 al día, compartidas entre los dos motores."
              : "Choose a sample and risk, or Free query. Test both engines and compare their sources. Academic access allows 15 queries per hour and 60 per day, shared by both engines."}
          </p>
          <RagWorkspace
            locale={locale}
            projects={projects}
            calls={[
              {
                id: "academic",
                title: es ? "Escenarios de evaluación" : "Evaluation scenarios",
              },
            ]}
            initialProject={projects[0].id}
            notes={[]}
            e5Enabled={ragConfigured()}
            qwenEnabled={qwenConfigured()}
            readOnly
          />
        </>
      )}
    </Shell>
  );
}
