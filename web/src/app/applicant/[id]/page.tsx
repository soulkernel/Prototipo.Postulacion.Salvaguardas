import { getRequestTime } from "@/lib/data";
import { redirect } from "next/navigation";
import { getApplication } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { ApplicationEditor } from "@/components/application-editor";
import type { Call } from "@/lib/domain";
export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const requestTime = await getRequestTime();
  const { id } = await params;
  const { viewer, application } = await getApplication(id);
  if (viewer.profile.role !== "applicant")
    redirect("/internal/applications/" + id);
  const locale = await getLocale();
  const [
    { data: call },
    { data: catalog },
    { data: versions },
    { data: documents },
  ] = await Promise.all([
    viewer.db.from("calls").select("*").eq("id", application.call_id).single(),
    viewer.db
      .from("safeguard_catalog")
      .select("id,label_es,label_en,normative_reference")
      .eq("active", true),
    viewer.db
      .from("application_versions")
      .select("id,revision,stage,submitted_at")
      .eq("application_id", id)
      .order("revision", { ascending: false }),
    viewer.db
      .from("application_documents")
      .select("id,file_name,kind,created_at")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!call) throw new Error("Call not available");
  const deadline =
    application.stage === 1 ? call.closes_at : application.phase2_deadline;
  const editable = Boolean(
    !application.deletion_pending &&
    deadline &&
    Date.parse(deadline) > requestTime &&
    (["draft", "selected_for_phase2", "phase2_draft"].includes(
      application.status,
    ) ||
      (application.correction_deadline &&
        Date.parse(application.correction_deadline) > requestTime)),
  );
  return (
    <Shell locale={locale}>
      <ApplicationEditor
        key={application.id + application.revision}
        application={application}
        call={call as Call}
        locale={locale}
        editable={editable}
        accountEmail={viewer.user.email || ""}
        catalog={catalog || []}
        versions={versions || []}
        documents={documents || []}
      />
    </Shell>
  );
}
