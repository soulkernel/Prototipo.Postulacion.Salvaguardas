import Link from "next/link";
import { getCalls, getViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell, SetupNotice } from "@/components/shell";
import { isConfigured } from "@/lib/supabase/server";
export default async function Home() {
  const locale = await getLocale();
  const viewer = await getViewer();
  const calls = isConfigured()
    ? (await getCalls()).filter((c) => c.status === "published")
    : [];
  return (
    <Shell locale={locale}>
      <section className="live-hero">
        <span className="eyebrow">GALÁPAGOS LIFE FUND</span>
        <h1>
          {locale === "es"
            ? "Portal de postulación a subvenciones del GLF"
            : "GLF grant application portal"}
        </h1>
        <p>
          {locale === "es"
            ? "Prepare su Nota Conceptual y la evaluación inicial de riesgos ambientales y sociales. Un expediente organizado, desde la primera idea hasta la decisión del GLF."
            : "Prepare your Concept Note and initial environmental and social risk screening. One organized application, from your first idea to GLF's decision."}
        </p>
        <div className="live-actions">
          {viewer ? (
            <Link
              className="button primary"
              href={
                viewer.profile.role === "applicant" ? "/applicant" : "/internal"
              }
            >
              {viewer.profile.role === "applicant"
                ? locale === "es"
                  ? "Mis postulaciones"
                  : "My applications"
                : locale === "es"
                  ? "Ir al panel GLF"
                  : "Go to GLF workspace"}
            </Link>
          ) : (
            <>
              <Link className="button primary" href="/register">
                {locale === "es" ? "Crear cuenta" : "Create account"}
              </Link>
              <Link className="button secondary" href="/login">
                {locale === "es" ? "Ya tengo una cuenta" : "I have an account"}
              </Link>
            </>
          )}
        </div>
      </section>
      <div className="section-heading" id="convocatorias">
        <h2>{locale === "es" ? "Convocatorias" : "Calls for proposals"}</h2>
      </div>
      {calls.length ? (
        <div className="live-grid">
          {calls.map((c) => (
            <article className="live-card" key={c.id}>
              <span className="eyebrow">{c.code}</span>
              <h2>{locale === "es" ? c.title_es : c.title_en}</h2>
              <p>{locale === "es" ? c.description_es : c.description_en}</p>
              <p>
                {locale === "es" ? "Cierre" : "Deadline"}:{" "}
                <time dateTime={c.closes_at}>
                  {new Date(c.closes_at).toLocaleString(locale, {
                    timeZone: "Pacific/Galapagos",
                  })}
                </time>{" "}
                · Galápagos
              </p>
              <Link className="button primary" href={"/applicant?call=" + c.id}>
                {locale === "es"
                  ? "Ver bases y postular"
                  : "View rules and apply"}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <SetupNotice locale={locale} />
      )}
      <section className="live-card" id="categorias">
        <h2>
          {locale === "es" ? "Categorías de subvención" : "Grant categories"}
        </h2>
        <p>
          {locale === "es"
            ? "Los montos, plazos y requisitos aplicables se indican en las bases de cada convocatoria. Cree su cuenta para elegir una categoría y preparar su Nota Conceptual."
            : "Applicable amounts, deadlines and requirements are defined in each call. Create your account to choose a category and prepare your Concept Note."}
        </p>
        <div className="live-grid">
          {[
            [
              "Pequeña",
              "Small",
              "Hasta USD 100.000 · hasta 12 meses",
              "Up to USD 100,000 · up to 12 months",
            ],
            [
              "Mediana",
              "Medium",
              "Hasta USD 250.000 · hasta 24 meses",
              "Up to USD 250,000 · up to 24 months",
            ],
            [
              "Grande",
              "Large",
              "Desde USD 250.000 · hasta 36 meses",
              "From USD 250,000 · up to 36 months",
            ],
          ].map((category) => (
            <article key={category[0]}>
              <h3>{category[locale === "es" ? 0 : 1]}</h3>
              <p>{category[locale === "es" ? 2 : 3]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="live-card" id="como-postular">
        <h2>
          {locale === "es"
            ? "Dos fases, con revisión humana"
            : "Two phases, with human review"}
        </h2>
        <p>
          {locale === "es"
            ? "1. Cree una cuenta y confirme su correo. 2. Ingrese y elija la convocatoria y categoría. 3. Complete la Nota Conceptual y la evaluación inicial de riesgos ambientales y sociales. La fase de proyecto completo se habilita únicamente por invitación del GLF."
            : "1. Create an account and confirm your email. 2. Sign in and choose a call and category. 3. Complete the Concept Note and initial environmental and social screening. The full proposal phase is available only upon GLF invitation."}
        </p>
        <div className="live-grid">
          <div>
            <h3>01 · {locale === "es" ? "Nota Conceptual" : "Concept Note"}</h3>
            <p>
              {locale === "es"
                ? "Describa su propuesta y actividades, e identifique y evalúe sus riesgos. Guarde su borrador y envíelo cuando esté completo."
                : "Describe your proposal and activities, and identify and assess their risks. Save your draft and submit it when complete."}
            </p>
          </div>
          <div>
            <h3>
              02 · {locale === "es" ? "Proyecto completo" : "Full proposal"}
            </h3>
            <p>
              {locale === "es"
                ? "Las propuestas seleccionadas reciben una invitación documentada para desarrollar su proyecto completo."
                : "Selected proposals receive a documented invitation to develop their full project."}
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
