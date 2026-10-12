import Link from "@/components/feedback-link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { RagWorkspace } from "@/components/rag-workspace";
import { qwenConfigured } from "@/lib/qwen";
import { ragConfigured } from "@/lib/rag";
import { CorpusImport } from "@/components/corpus-import";
import { projectRisks, type RagProject } from "@/lib/rag-context";
import type { Payload } from "@/lib/domain";
export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { profile, db } = await requireViewer([
    "sustainability_reviewer",
    "administrator",
  ]);
  const locale = await getLocale();
  const es = locale === "es";
  const projects: RagProject[] = [];
  const seen = new Set<string>();
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await db
      .from("application_versions")
      .select(
        "application_id,revision,stage,payload,applications!inner(reference_code,call_id)",
      )
      .order("revision", { ascending: false })
      .order("id")
      .range(offset, offset + 249);
    if (error) throw new Error("Cannot load submitted risk context");
    for (const v of data || []) {
      if (seen.has(v.application_id)) continue;
      seen.add(v.application_id);
      const a = Array.isArray(v.applications)
        ? v.applications[0]
        : v.applications;
      const payload = v.payload as Payload;
      projects.push({
        id: v.application_id,
        reference: a.reference_code,
        callId: a.call_id,
        revision: v.revision,
        stage: v.stage,
        title: payload.concept.title,
        risks: projectRisks(payload, locale),
      });
    }
    if (!data || data.length < 250) break;
  }
  const { data: calls, error: callsError } = await db
    .from("calls")
    .select("id,title_es,title_en")
    .order("opens_at", { ascending: false });
  if (callsError) throw new Error("Cannot load calls");
  const { data: notes, error: notesError } = await db
    .from("rag_review_notes")
    .select(
      "id,application_id,risk_id,revision,method,query,observation,created_at,evidence",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (notesError) throw new Error("Cannot load supporting review notes");
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
      <RagWorkspace
        locale={locale}
        e5Enabled={ragConfigured() && hasApprovedSources}
        qwenEnabled={qwenConfigured()}
        projects={projects}
        calls={(calls || []).map((c) => ({
          id: c.id,
          title: es ? c.title_es : c.title_en,
        }))}
        initialProject={(await searchParams).project || ""}
        notes={notes || []}
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
