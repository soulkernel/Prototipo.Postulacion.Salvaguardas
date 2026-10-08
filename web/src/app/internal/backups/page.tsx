import { requireViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { BackupDestination } from "@/components/backup-destination";

export default async function BackupsPage() {
  const viewer = await requireViewer(["administrator"]);
  const locale = await getLocale();
  const calls = await getCalls();
  return (
    <Shell locale={locale} internal>
      <BackupDestination
        userId={viewer.user.id}
        locale={locale}
        calls={calls.map((c) => ({
          id: c.id,
          title: locale === "es" ? c.title_es : c.title_en,
        }))}
      />
    </Shell>
  );
}
