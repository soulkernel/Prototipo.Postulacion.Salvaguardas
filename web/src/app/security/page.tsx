import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { MfaForm } from "@/components/mfa-form";
export default async function SecurityPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const { data } = await viewer.db.auth.mfa.listFactors();
  return (
    <Shell locale={locale}>
      <section className="live-card narrow">
        <h1>
          {locale === "es"
            ? "Verificación de seguridad"
            : "Security verification"}
        </h1>
        <MfaForm
          locale={locale}
          factorId={data?.totp.find((f) => f.status === "verified")?.id}
        />
      </section>
    </Shell>
  );
}
