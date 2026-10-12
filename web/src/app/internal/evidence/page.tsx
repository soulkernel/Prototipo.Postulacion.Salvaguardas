import Link from "@/components/feedback-link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { RagMethods } from "@/components/rag-methods";
import { qwenConfigured } from "@/lib/qwen";
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
      <p>
        {es
          ? "Dos métodos independientes para apoyar la revisión. Consulte las fuentes y conserve su criterio técnico; ninguna opción aprueba ni rechaza proyectos."
          : "Two independent methods to support review. Verify sources and apply your professional judgement; neither method approves or rejects projects."}
      </p>
      <RagMethods
        locale={locale}
        e5Enabled={ragConfigured() && hasApprovedSources}
        qwenEnabled={qwenConfigured()}
      />
      {profile.role === "administrator" && (
        <section
          aria-label={
            es ? "Administración del corpus E5" : "E5 corpus administration"
          }
        >
          <h2>{es ? "Fuentes del buscador E5" : "E5 search sources"}</h2>
          <CorpusImport locale={locale} />
        </section>
      )}
    </Shell>
  );
}
