import Image from "next/image";
import { getLocale } from "@/lib/locale";
import { StaffActivation } from "@/components/staff-activation";
import { LanguageSwitch } from "@/components/language-switch";
import { z } from "zod";
export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const locale = await getLocale();
  const id = z.uuid().safeParse((await searchParams).id);
  return (
    <main className="auth-shell" id="main-content">
      <section className="auth-card">
        <div className="auth-brand-panel">
          <Image
            src="/glf-logo.png"
            alt="Galápagos Life Fund"
            width={150}
            height={65}
          />
        </div>
        <div className="auth-language">
          <LanguageSwitch locale={locale} />
        </div>
        <h1>
          {locale === "es"
            ? "Activar cuenta interna GLF"
            : "Activate GLF staff account"}
        </h1>
        <StaffActivation
          locale={locale}
          invitationId={id.success ? id.data : ""}
        />
      </section>
    </main>
  );
}
