import { getRequestTime } from "@/lib/data";
import { redirect } from "next/navigation";
import { getApplication } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { ApplicationEditor } from "@/components/application-editor";
import { ReceiptDownload } from "@/components/receipt-download";
import { receiptDate } from "@/lib/receipt";
import type { Call } from "@/lib/domain";
export const maxDuration = 60;
export default async function ApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ receipt?: string }>;
}) {
  const requestTime = await getRequestTime();
  const { id } = await params;
  const { viewer, application } = await getApplication(id);
  if (viewer.profile.role !== "applicant")
    redirect("/internal/applications/" + id);
  const locale = await getLocale();
  const query = await searchParams;
  const [
    { data: call, error: callError },
    { data: catalog, error: catalogError },
    { data: versions, error: versionError },
    { data: documents, error: documentError },
    { data: prepared, error: preparedError },
  ] = await Promise.all([
    viewer.db.from("calls").select("*").eq("id", application.call_id).single(),
    viewer.db
      .from("safeguard_catalog")
      .select("id,label_es,label_en,normative_reference")
      .eq("active", true),
    viewer.db
      .from("application_versions")
      .select("id,revision,stage,submitted_at,payload")
      .eq("application_id", id)
      .order("revision", { ascending: false }),
    viewer.db
      .from("application_documents")
      .select("id,file_name,kind,created_at")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    viewer.db
      .from("prepared_documents")
      .select("id,revision,stage,created_at")
      .eq("application_id", id)
      .eq("stage", application.stage)
      .order("revision", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (
    callError ||
    catalogError ||
    versionError ||
    documentError ||
    preparedError ||
    !call
  )
    throw new Error("Cannot load the complete application");
  const deadline =
    application.stage === 1 ? call.closes_at : application.phase2_deadline;
  const editable = Boolean(
    viewer.profile.access_kind !== "academic" &&
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
    <Shell locale={locale} internal={viewer.profile.access_kind === "academic"}>
      {versions?.[0] && (
        <section
          className="live-card"
          aria-label={
            locale === "es"
              ? "Confirmación de recepción"
              : "Receipt confirmation"
          }
        >
          <h2>
            {locale === "es"
              ? "Postulación recibida por el GLF"
              : "Application received by GLF"}
          </h2>
          <p>
            {application.reference_code} ·{" "}
            {receiptDate(versions[0].submitted_at, locale)}{" "}
            {locale === "es" ? "(hora Galápagos)" : "(Galapagos time)"}
          </p>
          <p>
            {locale === "es"
              ? "Puede descargar su comprobante aquí. Si el navegador bloquea la descarga automática, utilice el botón."
              : "Download your receipt here. If your browser blocks the automatic download, use the button."}
          </p>
          <ReceiptDownload
            id={versions[0].id}
            locale={locale}
            automatic={query.receipt === versions[0].id}
          />
        </section>
      )}
      <ApplicationEditor
        key={`${application.id}:${application.stage}:${application.status}:${editable}:${locale}`}
        application={application}
        call={call as Call}
        locale={locale}
        editable={editable}
        academicReadOnly={viewer.profile.access_kind === "academic"}
        serverNow={requestTime}
        accountEmail={viewer.user.email || ""}
        catalog={catalog || []}
        versions={(versions || []).map(({ payload, ...v }) => ({
          ...v,
          project_title:
            typeof payload?.concept?.title === "string"
              ? payload.concept.title
              : undefined,
        }))}
        documents={documents || []}
        initialPrepared={prepared}
      />
    </Shell>
  );
}
