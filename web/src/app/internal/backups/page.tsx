import { requireViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { BackupDestination } from "@/components/backup-destination";

export default async function BackupsPage() {
  const viewer = await requireViewer(["administrator"]);
  const locale = await getLocale();
  const calls = await getCalls();
  const applications: {
    id: string;
    call_id: string;
    reference_code: string;
    title: string;
  }[] = [];
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await viewer.db
      .from("applications")
      .select("id,call_id,reference_code")
      .not("submitted_at", "is", null)
      .order("reference_code")
      .range(offset, offset + 249);
    if (error) throw new Error("Cannot load backup applications");
    if (!data?.length) break;
    const titles = new Map<string, string>();
    for (let versionOffset = 0; ; versionOffset += 250) {
      const { data: versions, error: versionError } = await viewer.db
        .from("application_versions")
        .select("application_id,revision,payload")
        .in(
          "application_id",
          data.map((a) => a.id),
        )
        .order("revision", { ascending: false })
        .order("id")
        .range(versionOffset, versionOffset + 249);
      if (versionError) throw new Error("Cannot load submitted titles");
      for (const v of versions || [])
        if (!titles.has(v.application_id))
          titles.set(v.application_id, String(v.payload?.concept?.title || ""));
      if (!versions || versions.length < 250) break;
    }
    applications.push(
      ...data.map((a) => ({
        ...a,
        title: titles.get(a.id) || a.reference_code,
      })),
    );
    if (data.length < 250) break;
  }
  return (
    <Shell locale={locale} internal>
      <BackupDestination
        userId={viewer.user.id}
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
