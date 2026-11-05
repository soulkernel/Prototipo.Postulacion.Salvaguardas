import { Shell } from "@/components/shell";
import { ExclusionList } from "@/components/exclusion-list";
import { getLocale } from "@/lib/locale";
import "./exclusions.css";

export default async function ExclusionsPage() {
  const locale = await getLocale();
  return (
    <Shell locale={locale}>
      <ExclusionList locale={locale} />
    </Shell>
  );
}
