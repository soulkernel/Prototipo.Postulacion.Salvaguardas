import Link from "next/link";
import { getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell, SetupNotice } from "@/components/shell";
import { isConfigured } from "@/lib/supabase/server";
export default async function Home() {
  const locale = await getLocale();
  const calls = isConfigured()
    ? (await getCalls()).filter((c) => c.status === "published")
    : [];
  return (
    <Shell locale={locale}>
      <section className="live-hero">
        <span className="eyebrow">GALÁPAGOS LIFE FUND</span>
        <h1>
          {locale === "es"
            ? "Ideas que conservan el futuro de Galápagos"
            : "Ideas that conserve the future of Galápagos"}
        </h1>
        <p>
          {locale === "es"
            ? "Prepare su Nota Conceptual y sus salvaguardas ambientales y sociales. Un expediente organizado, desde la primera idea hasta la decisión del GLF."
            : "Prepare your Concept Note and environmental and social safeguards. One organized application, from your first idea to GLF's decision."}
        </p>
        <div className="live-actions">
          <Link className="button primary" href="/register">
            {locale === "es" ? "Crear cuenta" : "Create account"}
          </Link>
          <Link className="button secondary" href="/login">
            {locale === "es" ? "Ya tengo una cuenta" : "I have an account"}
          </Link>
        </div>
      </section>
      <div className="section-heading">
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
      <section className="live-card">
        <h2>
          {locale === "es"
            ? "Dos fases, con revisión humana"
            : "Two phases, with human review"}
        </h2>
        <div className="live-grid">
          <div>
            <h3>01 · {locale === "es" ? "Nota Conceptual" : "Concept Note"}</h3>
            <p>
              {locale === "es"
                ? "Describa su propuesta, actividades, riesgos y medidas. Guarde su borrador y envíelo cuando esté completo."
                : "Describe your proposal, activities, risks and measures. Save your draft and submit it when complete."}
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
