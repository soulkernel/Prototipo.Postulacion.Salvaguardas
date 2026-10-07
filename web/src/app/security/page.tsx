import { redirect } from "next/navigation";
import { getViewer, getRequestTime } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { MfaForm } from "@/components/mfa-form";
import { cookies } from "next/headers";
import { sessionPreferenceCookie } from "@/lib/session-preference";
export default async function SecurityPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const { data: assurance } =
    await viewer.db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === "aal2")
    redirect(viewer.profile.role === "applicant" ? "/applicant" : "/internal");
  const preference = (await cookies()).get(sessionPreferenceCookie)?.value;
  const requestTime = await getRequestTime();
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
          remembered={Boolean(
            preference &&
            preference !== "session" &&
            Number(preference) > requestTime,
          )}
          factorId={data?.totp.find((f) => f.status === "verified")?.id}
        />
      </section>
    </Shell>
  );
}
