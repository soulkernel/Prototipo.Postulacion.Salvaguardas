import "../../manual.css";
import { Shell } from "@/components/shell";
import { InternalManual } from "@/components/internal-manual";
import { requireReadViewer } from "@/lib/data";
import { internalManualRoles } from "@/lib/internal-manual-access";
import { getLocale } from "@/lib/locale";

export default async function InternalManualPage() {
  const viewer = await requireReadViewer(internalManualRoles);
  const locale = await getLocale();
  const backHref =
    viewer.profile.access_kind === "academic"
      ? "/evaluation"
      : viewer.profile.role === "internal_member"
        ? "/access"
        : "/internal";
  return (
    <Shell locale={locale} internal>
      <InternalManual locale={locale} backHref={backHref} />
    </Shell>
  );
}
