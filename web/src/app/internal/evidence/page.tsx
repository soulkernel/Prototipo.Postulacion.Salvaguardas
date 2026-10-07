import Link from "next/link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { EvidenceSearch } from "@/components/evidence-search";
import { ragConfigured } from "@/lib/rag";
import { CorpusImport } from "@/components/corpus-import";
export default async function EvidencePage() {
  const { profile, db } = await requireViewer([
    "sustainability_reviewer",
    "administrator",
  ]);
  const locale = await getLocale();
  const es = locale === "es";
  const { count: approvedCount, error: countError } = await db
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("approved", true);
  if (countError) throw new Error("Corpus status unavailable");
  const hasApprovedSources = (approvedCount || 0) > 0;
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
            ? ragConfigured() && hasApprovedSources
              ? "La búsqueda utiliza E5 en la nube y fuentes aprobadas del corpus GLF."
              : "La consulta se habilitará cuando existan fuentes revisadas y aprobadas. La carga del corpus no equivale a su validación técnica."
            : ragConfigured() && hasApprovedSources
              ? "Search uses cloud E5 and approved GLF corpus sources."
              : "Search becomes available when reviewed and approved sources exist. Corpus upload does not constitute technical validation."}
        </p>
        <p>
          {es
            ? "La búsqueda deberá devolver documentos, versiones y localizadores verificables. Las calificaciones y decisiones permanecen a cargo del equipo GLF."
            : "Search must return documents, versions and verifiable locators. Ratings and decisions remain with GLF staff."}
        </p>
      </section>
      <EvidenceSearch
        locale={locale}
        enabled={ragConfigured() && hasApprovedSources}
      />
      {profile.role === "administrator" && <CorpusImport locale={locale} />}
    </Shell>
  );
}
