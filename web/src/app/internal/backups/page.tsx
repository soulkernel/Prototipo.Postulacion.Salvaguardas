import { defaultCall, categoryOptions } from "@/lib/inbox-filters";
import { requireViewer, getCallOptions } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { BackupDestination } from "@/components/backup-destination";

export default async function BackupsPage() {
  const viewer = await requireViewer(["administrator"]);
  const locale = await getLocale();
  const calls = await getCallOptions();
  const applications: {
    id: string;
    call_id: string;
    reference_code: string;
    title: string;
    category: string;
    proponent: string;
    status: string;
  }[] = [];
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await viewer.db.from("latest_submitted_applications")
      .select("id,call_id,reference_code,title,category,proponent,status")
      .order("reference_code").order("id").range(offset, offset + 249);
    if (error) throw new Error("Cannot load backup applications");
    applications.push(...(data || []));
    if (!data || data.length < 250) break;
  }
  return (
    <Shell locale={locale} internal>
      <BackupDestination
        defaultCallId={defaultCall(calls)}
        categories={categoryOptions(calls, locale)}
        applications={applications}
        locale={locale}
        calls={calls.map((c) => ({
          id: c.id,
          title: locale === "es" ? c.title_es : c.title_en,
        }))}
      />
    </Shell>
  );
}
