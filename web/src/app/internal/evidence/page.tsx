import Link from "next/link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
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
            ? "Consulta de evidencia desde el equipo GLF"
            : "Evidence retrieval from the GLF computer"}
        </h2>
        <p>
          {es
            ? "La inferencia E5 se ejecutará en el equipo autorizado. El servicio local todavía no está conectado a este portal."
            : "E5 inference will run on the authorized computer. The local service is not yet connected to this portal."}
        </p>
        <p>
          {es
            ? "La búsqueda deberá devolver documentos, versiones y localizadores verificables. Las calificaciones y decisiones permanecen a cargo del equipo GLF."
            : "Search must return documents, versions and verifiable locators. Ratings and decisions remain with GLF staff."}
        </p>
      </section>
    </Shell>
  );
}
