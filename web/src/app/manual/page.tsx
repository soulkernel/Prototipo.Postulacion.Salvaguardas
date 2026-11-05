import { Shell } from "@/components/shell";
import { ApplicantManual } from "@/components/applicant-manual";
import { getLocale } from "@/lib/locale";
export default async function ManualPage() {
  const locale = await getLocale();
  return (
    <Shell locale={locale}>
      <ApplicantManual locale={locale} />
    </Shell>
  );
}
