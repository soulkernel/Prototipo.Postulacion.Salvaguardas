import { ModuleHeading } from "@/components/module-heading";
import { BackLink } from "@/components/back-link";
import { requireRagViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { RagWorkspace } from "@/components/rag-workspace";
import { qwenConfigured } from "@/lib/qwen";
import { ragConfigured } from "@/lib/rag";
import { CorpusImport } from "@/components/corpus-import";
export const maxDuration = 60;
export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { profile, db } = await requireRagViewer();
  const locale = await getLocale();
  const es = locale === "es";
  const { data: calls, error: callsError } = await db
    .from("calls")
    .select("id,title_es,title_en")
    .order("opens_at", { ascending: false });
  if (callsError) throw new Error("Cannot load calls");
  const { count: approvedCount, error: countError } = await db
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("approved", true);
  if (countError) throw new Error("Corpus status unavailable");
  const academic = profile.access_kind === "academic";
  const academicCount = academic ? await db.rpc("academic_source_count") : null;
  const hasApprovedSources = academic
    ? !academicCount?.error && (academicCount?.data || 0) > 0
    : (approvedCount || 0) > 0;
  return (
    <Shell locale={locale} internal>
      <BackLink href="/internal">{es ? "Volver a expedientes" : "Back to applications"}</BackLink>
      <ModuleHeading
        title={
          es
            ? "Asistente de consulta de salvaguardas GLF"
            : "GLF safeguards query assistant"
        }
      >
        <p>
          {es
            ? "Apoyo para identificar riesgos y salvaguardas ambientales y sociales en proyectos financiados por el GLF. Utilice uno o ambos modelos para fundamentar su revisión."
            : "Support for identifying environmental and social risks and safeguards in GLF-funded projects. Use one or both models to inform your review."}
        </p>
      </ModuleHeading>
      <RagWorkspace
        locale={locale}
        e5Enabled={ragConfigured() && hasApprovedSources}
        qwenEnabled={qwenConfigured()}
        projects={[]}
        remote
        calls={(calls || []).map((c) => ({
          id: c.id,
          title: es ? c.title_es : c.title_en,
        }))}
        initialProject={(await searchParams).project || ""}
        notes={[]}
        readOnly={academic}
        showApplicationLinks
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
