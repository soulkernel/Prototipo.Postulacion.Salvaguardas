import Link from "next/link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";

export default async function ApplicationGuide() {
  await requireViewer(["applicant"]);
  const locale = await getLocale();
  const es = locale === "es";
  return (
    <Shell locale={locale}>
      <div className="live-title">
        <div>
          <h1>{es ? "Cómo postular" : "How to apply"}</h1>
          <p>
            {es
              ? "Consulte esta guía sin perder su borrador."
              : "Consult this guide without losing your draft."}
          </p>
        </div>
        <Link className="button secondary" href="/applicant">
          {es ? "Nueva postulación" : "New application"}
        </Link>
      </div>
      <section className="live-card">
        <h2>{es ? "Un proceso en dos etapas" : "A two-stage process"}</h2>
        <div className="live-grid">
          <div>
            <h3>{es ? "1. Nota conceptual" : "1. Concept note"}</h3>
            <p>
              {es
                ? "Presente la idea, sus objetivos, actividades, resultados previstos y presupuesto estimado. Identifique los riesgos ambientales y sociales y evalúe su probabilidad y gravedad."
                : "Present the idea, objectives, activities, expected results and estimated budget. Identify environmental and social risks and assess their likelihood and severity."}
            </p>
            <p>
              {es
                ? "Puede guardar un borrador incompleto y retomarlo. Antes de enviarlo, complete los campos obligatorios, genere los documentos y adjunte las versiones firmadas y los anexos requeridos."
                : "Save an incomplete draft and resume it later. Before submitting, complete required fields, generate documents and attach signed versions and required annexes."}
            </p>
          </div>
          <div>
            <h3>{es ? "2. Propuesta completa" : "2. Full proposal"}</h3>
            <p>
              {es
                ? "Esta etapa se habilita únicamente cuando GLF le invita después de revisar su nota conceptual. Desarrolle el proyecto detallado, cronograma, presupuesto, evaluación completa de riesgos, PGAS y medidas de mitigación."
                : "This stage is enabled only when GLF invites you after reviewing your concept note. Develop the detailed project, schedule, budget, full risk assessment, ESMP and mitigation measures."}
            </p>
            <p>
              {es
                ? "La invitación no equivale a la aprobación del financiamiento. La decisión formal y el convenio corresponden a pasos posteriores."
                : "An invitation is not funding approval. A formal decision and agreement follow later."}
            </p>
          </div>
        </div>
      </section>
      <section className="live-card">
        <h2>{es ? "Categorías de subvención" : "Grant categories"}</h2>
        <p>
          {es
            ? "Referencia: segunda convocatoria, cerrada el 2 de febrero de 2026. Para una nueva solicitud, consulte los valores y condiciones de la convocatoria abierta en «Nueva postulación»."
            : "Reference: second call, closed on 2 February 2026. For a new application, consult the values and conditions of the open call under New application."}
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{es ? "Categoría" : "Category"}</th>
                <th>{es ? "Financiamiento GLF" : "GLF funding"}</th>
                <th>{es ? "Duración máxima" : "Maximum duration"}</th>
                <th>{es ? "Cofinanciamiento" : "Co-financing"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{es ? "Pequeña" : "Small"}</td>
                <td>≤ USD 100.000</td>
                <td>{es ? "12 meses" : "12 months"}</td>
                <td>
                  {es
                    ? "No obligatorio; se recomienda en especie"
                    : "Optional; in-kind recommended"}
                </td>
              </tr>
              <tr>
                <td>{es ? "Mediana" : "Medium"}</td>
                <td>≤ USD 250.000</td>
                <td>{es ? "24 meses" : "24 months"}</td>
                <td>
                  {es ? "10%, en especie o efectivo" : "10%, in-kind or cash"}
                </td>
              </tr>
              <tr>
                <td>{es ? "Grande" : "Large"}</td>
                <td>≥ USD 250.000</td>
                <td>{es ? "36 meses" : "36 months"}</td>
                <td>25%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          {es
            ? "La publicación sitúa USD 250.000 en ambas categorías; seleccione según las bases configuradas para la convocatoria vigente."
            : "The publication places USD 250,000 in both categories; select according to the configured rules of the current call."}
        </p>
      </section>
      <section className="live-card">
        <h2>{es ? "Consulta rápida" : "Quick reference"}</h2>
        <details>
          <summary>
            {es
              ? "Elegibilidad en la segunda convocatoria"
              : "Eligibility in the second call"}
          </summary>
          <p>
            {es
              ? "Personas naturales: residencia permanente en Galápagos y categoría pequeña. Personas jurídicas: operación legal y oficina en las islas durante al menos dos años."
              : "Individuals: permanent Galápagos residency and small grants. Legal entities: legal operation and an office on the islands for at least two years."}
          </p>
        </details>
        <details>
          <summary>
            {es ? "Documentos y envío" : "Documents and submission"}
          </summary>
          <p>
            {es
              ? "Los anexos obligatorios son los que indica el formulario de su convocatoria. La nota conceptual y la matriz de riesgos se generan por separado. Compruebe las firmas y los archivos adjuntos antes de enviar."
              : "Required annexes are those shown in your call's form. The concept note and risk matrix are generated separately. Check signatures and attachments before submitting."}
          </p>
        </details>
        <details>
          <summary>{es ? "Después de enviar" : "After submission"}</summary>
          <p>
            {es
              ? "Consulte su expediente en «Mis postulaciones». La versión remitida queda bloqueada; cualquier corrección requiere autorización del GLF y un nuevo envío dentro del plazo habilitado."
              : "View your dossier under My applications. The submitted version is locked; corrections require GLF authorization and resubmission within the enabled deadline."}
          </p>
        </details>
        <p>
          <a
            href="https://galapagoslifefund.org.ec/es/2convocatoria/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {es
              ? "Fuente institucional · Segunda convocatoria"
              : "Institutional source · Second call"}
          </a>
        </p>
      </section>
    </Shell>
  );
}
