import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "./language-switch";
import type { Locale } from "@/lib/domain";
export function Shell({
  locale,
  children,
  internal = false,
}: {
  locale: Locale;
  children: React.ReactNode;
  internal?: boolean;
}) {
  return (
    <div className="live-shell">
      <header className="live-header">
        <Link className="live-brand" href="/">
          <Image
            src="/glf-logo.png"
            alt="Galápagos Life Fund"
            width={165}
            height={71}
            priority
          />
        </Link>
        <nav
          aria-label={
            locale === "es" ? "Navegación principal" : "Main navigation"
          }
        >
          <Link href="/">{locale === "es" ? "Convocatorias" : "Calls"}</Link>
          <Link href="/applicant">
            {locale === "es" ? "Mis postulaciones" : "My applications"}
          </Link>
          <Link href="/internal">
            {locale === "es" ? "Personal GLF" : "GLF staff"}
          </Link>
        </nav>
        <LanguageSwitch locale={locale} />
      </header>
      <main className="live-main" id="main-content">
        {internal && (
          <p className="eyebrow">
            {locale === "es" ? "ESPACIO INTERNO GLF" : "GLF STAFF WORKSPACE"}
          </p>
        )}
        {children}
      </main>
      <footer className="live-footer">
        <span>Galápagos Life Fund</span>
        <span>
          {locale === "es"
            ? "Postulaciones · Salvaguardas · Decisiones trazables"
            : "Applications · Safeguards · Accountable decisions"}
        </span>
      </footer>
    </div>
  );
}
export function SetupNotice({ locale }: { locale: Locale }) {
  return (
    <section className="live-empty">
      <h2>
        {locale === "es" ? "Portal en preparación" : "Portal in preparation"}
      </h2>
      <p>
        {locale === "es"
          ? "Las postulaciones se habilitarán cuando GLF publique una convocatoria."
          : "Applications will open when GLF publishes a call."}
      </p>
      <Link className="button secondary" href="/demo">
        {locale === "es"
          ? "Explorar demostración con datos ficticios"
          : "Explore demo with fictional data"}
      </Link>
    </section>
  );
}
