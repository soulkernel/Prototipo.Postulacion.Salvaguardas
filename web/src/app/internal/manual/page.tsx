import "../../manual.css";
import { Shell } from "@/components/shell";
import { InternalManual } from "@/components/internal-manual";
import { requireViewer } from "@/lib/data";
import { internalManualRoles } from "@/lib/internal-manual-access";
import { getLocale } from "@/lib/locale";

export default async function InternalManualPage() {
  const viewer = await requireViewer(internalManualRoles);
  const locale = await getLocale();
  const backHref =
    viewer.profile.role === "internal_member" ? "/access" : "/internal";
  return (
    <Shell locale={locale} internal>
      <InternalManual locale={locale} backHref={backHref} />
    </Shell>
  );
}
