import Link from "next/link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { EvidenceSearch } from "@/components/evidence-search";
import { ragConfigured } from "@/lib/rag";
export default async function EvidencePage() {
  await requireViewer(["sustainability_reviewer", "administrator"]);
  const locale = await getLocale();
  const es = locale === "es";
  return (
    <Shell locale={locale} internal>
      <Link href="/internal">← GLF</Link>
      <h1>
        {es
          ? "Asistente RAG para identificar riesgos y salvaguardas ambientales y sociales en proyectos financiados por el GLF (Galapagos Life Fund)"
          : "RAG assistant for identifying environmental and social risks and safeguards in GLF-funded projects"}
      </h1>
      <section className="live-card">
        <h2>
          {es
            ? "Consulta de evidencia normativa"
            : "Normative evidence retrieval"}
        </h2>
        <p>
          {es
            ? ragConfigured()
              ? "La búsqueda utiliza E5 en la nube y fuentes aprobadas del corpus GLF."
              : "La conexión está preparada. Falta activar el servicio E5 en la nube e incorporar el corpus aprobado."
            : ragConfigured()
              ? "Search uses cloud E5 and approved GLF corpus sources."
              : "The connection is prepared. Cloud E5 and the approved corpus still need activation."}
        </p>
        <p>
          {es
            ? "La búsqueda deberá devolver documentos, versiones y localizadores verificables. Las calificaciones y decisiones permanecen a cargo del equipo GLF."
            : "Search must return documents, versions and verifiable locators. Ratings and decisions remain with GLF staff."}
        </p>
      </section>
      <EvidenceSearch locale={locale} enabled={ragConfigured()} />
    </Shell>
  );
}
