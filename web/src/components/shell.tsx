import Image from "next/image";
import Link from "next/link";
import { MenuLink } from "./menu-link";
import { LanguageSwitch } from "./language-switch";
import type { Locale } from "@/lib/domain";
import { getViewer } from "@/lib/data";
export async function Shell({
  locale,
  children,
  internal = false,
}: {
  locale: Locale;
  children: React.ReactNode;
  internal?: boolean;
}) {
  const viewer = await getViewer();
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
          {viewer?.profile.role === "applicant" && (
            <>
              <MenuLink href="/applicant#convocatorias">
                {locale === "es" ? "Nueva postulación" : "New application"}
              </MenuLink>
              <MenuLink href="/applicant#expedientes">
                {locale === "es" ? "Mis postulaciones" : "My applications"}
              </MenuLink>
            </>
          )}
          {viewer && viewer.profile.role !== "applicant" && (
            <>
              <MenuLink href="/internal">
                {locale === "es" ? "Expedientes" : "Applications"}
              </MenuLink>
              {["grants_manager", "administrator"].includes(
                viewer.profile.role,
              ) && (
                <MenuLink href="/internal/calls">
                  {locale === "es" ? "Convocatorias" : "Calls"}
                </MenuLink>
              )}
              {["sustainability_reviewer", "administrator"].includes(
                viewer.profile.role,
              ) && (
                <MenuLink href="/internal/evidence">
                  {locale === "es" ? "Asistente RAG" : "RAG assistant"}
                </MenuLink>
              )}
              <MenuLink href="/internal/reports">
                {locale === "es" ? "Reportes" : "Reports"}
              </MenuLink>
              {viewer.profile.role === "administrator" && (
                <MenuLink href="/internal/backups">
                  {locale === "es" ? "Respaldos" : "Backups"}
                </MenuLink>
              )}
              {(viewer.profile.role === "administrator" ||
                viewer.profile.user_admin_scope !== "none") && (
                <MenuLink href="/internal/users">
                  {locale === "es" ? "Gestión de usuarios" : "User management"}
                </MenuLink>
              )}
            </>
          )}
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
    </section>
  );
}
