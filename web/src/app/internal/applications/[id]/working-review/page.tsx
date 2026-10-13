import Link from "@/components/feedback-link";
import { Shell } from "@/components/shell";
import {
  WorkingReview,
  type ReviewCriterion,
} from "@/components/working-review";
import { requireViewer, getApplication, getRequestTime } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { notFound } from "next/navigation";
export default async function WorkingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const requestTime = await getRequestTime();
  const viewer = await requireViewer([
    "grants_manager",
    "project_coordinator",
    "committee_member",
    "administrator",
  ]);
  const { id } = await params;
  const { application: a } = await getApplication(id);
  const locale = await getLocale(),
    es = locale === "es";
  const { data: v, error } = await viewer.db
    .from("application_versions")
    .select("id,stage,revision")
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
  const sections = await Promise.all(
    kinds.map(async (kind) => {
      const { data: pin, error: pe } = await viewer.db
        .from("call_review_templates")
        .select("template_id")
        .eq("call_id", a.call_id)
        .eq("stage", v.stage)
        .eq("kind", kind)
        .maybeSingle();
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
      const { data: d, error: de } = await viewer.db
        .from("review_working_drafts")
        .select("answers,notes,revision")
        .eq("version_id", v.id)
        .eq("reviewer_id", viewer.user.id)
        .eq("kind", kind)
        .maybeSingle();
      if (te || de) throw new Error("Cannot load working review");
      return { kind: kind as "rubric" | "administrative", t, d };
    }),
  );
  const { data: history, error: he } = await viewer.db
    .from("review_draft_history")
    .select("revision,created_at,notes")
    .eq("application_id", id)
    .eq("reviewer_id", viewer.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (he) throw new Error("Cannot load review audit");
  return (
    <Shell locale={locale} internal>
      <Link href={"/internal/applications/" + id}>
        ← {es ? "Volver al expediente" : "Back to application"}
      </Link>
      <h1>{a.payload.concept.title}</h1>
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
