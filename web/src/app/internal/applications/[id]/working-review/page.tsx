import { BackLink } from "@/components/back-link";
import { Shell } from "@/components/shell";
import {
  WorkingReview,
  type ReviewCriterion,
} from "@/components/working-review";
import { requireViewer, getApplication, getRequestTime } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { notFound } from "next/navigation";
import { safeReturnPath } from "@/lib/domain";
export default async function WorkingReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const requestTime = await getRequestTime();
  const viewer = await requireViewer([
    "grants_manager",
    "project_coordinator",
    "committee_member",
    "administrator",
  ]);
  const { id } = await params;
  const returnTo = safeReturnPath((await searchParams).returnTo, "/internal");
  const { application: a } = await getApplication(id);
  const locale = await getLocale(),
    es = locale === "es";
  const { data: v, error } = await viewer.db
    .from("application_versions")
    .select("id,stage,revision,payload")
    .eq("application_id", id)
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Cannot read submitted version");
  if (!v) notFound();
  const kinds =
    viewer.profile.role === "administrator"
      ? ["administrative", "rubric"]
      : viewer.profile.role === "committee_member"
        ? ["rubric"]
        : ["administrative"];
  const [sections, { data: history, error: he }] = await Promise.all([
    Promise.all(
    kinds.map(async (kind) => {
      const [{ data: pin, error: pe }, { data: d, error: de }] = await Promise.all([viewer.db
        .from("call_review_templates")
        .select("template_id")
        .eq("call_id", a.call_id)
        .eq("stage", v.stage)
        .eq("kind", kind)
        .maybeSingle(),
        viewer.db.from("review_working_drafts").select("answers,notes,revision")
          .eq("version_id", v.id).eq("reviewer_id", viewer.user.id).eq("kind", kind).maybeSingle(),
      ]);
      if (pe) throw new Error("Cannot load pinned rubric");
      let q = viewer.db
        .from("review_templates")
        .select("*")
        .eq("stage", v.stage)
        .eq("kind", kind);
      if (pin) q = q.eq("id", pin.template_id);
      const { data: t, error: te } = await q
        .order("id", { ascending: false })
        .limit(1)
        .single();
      if (te || de) throw new Error("Cannot load working review");
      return { kind: kind as "rubric" | "administrative", t, d };
    }),
    ),
    viewer.db
    .from("review_draft_history")
    .select("revision,created_at,notes")
    .eq("application_id", id)
    .eq("reviewer_id", viewer.user.id)
    .order("created_at", { ascending: false })
    .limit(50),
  ]);
  if (he) throw new Error("Cannot load review audit");
  return (
    <Shell locale={locale} internal>
      <BackLink href={`/internal/applications/${id}?${new URLSearchParams({ returnTo })}`}>
        {es ? "Volver al expediente" : "Back to application"}
      </BackLink>
      <header className="module-heading">
        <h1>{v.payload.concept.title}</h1>
      </header>
      <p>
        {a.reference_code} · {es ? "Versión presentada" : "Submitted version"}{" "}
        {v.revision} · {es ? "Fase" : "Phase"} {v.stage}
      </p>
      {sections.map((s) => (
        <WorkingReview
          key={s.kind}
          applicationId={id}
          versionId={v.id}
          kind={s.kind}
          templateId={s.t.id}
          criteria={s.t.criteria as ReviewCriterion[]}
          initial={s.d}
          editable={
            ["submitted", "under_review", "phase2_submitted"].includes(
              a.status,
            ) &&
            (!a.correction_deadline ||
              Date.parse(a.correction_deadline) <= requestTime)
          }
          locale={locale}
        />
      ))}
      <section className="live-card">
        <h2>{es ? "Historial de mis borradores" : "My draft history"}</h2>
        {history?.map((h, i) => (
          <p key={i}>
            {es ? "Revisión" : "Revision"} {h.revision} ·{" "}
            {new Date(h.created_at).toLocaleString(locale, {
              timeZone: "Pacific/Galapagos",
            })}{" "}
            · {h.notes}
          </p>
        ))}
      </section>
    </Shell>
  );
}
