import { getRequestTime } from "@/lib/data";
import Link from "next/link";
import { requireViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { createDraft } from "./actions";
import { signOut } from "@/app/auth/actions";
export default async function ApplicantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const requestTime = await getRequestTime();
  const viewer = await requireViewer(["applicant"]);
  const locale = await getLocale();
  const es = locale === "es";
  const params = await searchParams;
  const calls = (await getCalls()).filter(
    (c) =>
      c.status === "published" &&
      c.opens_at !== null &&
      c.closes_at !== null &&
      Date.parse(c.opens_at) <= requestTime &&
      Date.parse(c.closes_at) > requestTime,
  );
  return (
    <Shell locale={locale}>
      <div className="live-title">
        <div>
          <p className="eyebrow">{viewer.profile.full_name}</p>
          <h1>{es ? "Nueva postulación" : "New application"}</h1>
        </div>
        <form action={signOut}>
          <button className="button secondary">
            {es ? "Cerrar sesión" : "Sign out"}
          </button>
        </form>
      </div>
      {params.error && (
        <div role="alert" className="auth-error">
          {es
            ? "No fue posible abrir el borrador. Compruebe que la convocatoria está abierta."
            : "The draft could not be opened. Check that the call is open."}
        </div>
      )}
      <section className="live-card" id="convocatorias">
        <h2>
          {es ? "Prepare su nota conceptual" : "Prepare your concept note"}
        </h2>
        <p>
          {es
            ? "La nota conceptual es la primera presentación de su proyecto: explique qué propone, para qué, dónde y con qué presupuesto, e identifique sus riesgos ambientales y sociales. Si GLF la preselecciona, le invitará a presentar una propuesta completa."
            : "The concept note is your first project submission: explain what you propose, why, where and with what budget, and identify environmental and social risks. If GLF shortlists it, you will be invited to submit a full proposal."}
        </p>
        <p>
          <Link href="/applicant/guide">
            {es
              ? "Cómo postular · Etapas, categorías y requisitos"
              : "How to apply · Stages, categories and requirements"}
          </Link>
        </p>
        {calls.length ? (
          <div className="live-form">
            {calls.map((call) => (
              <section key={call.id}>
                <h3>{es ? call.title_es : call.title_en}</h3>
                <p>{es ? call.description_es : call.description_en}</p>
                <h3>
                  {es
                    ? "Escoja la categoría de subvención a la que desea aplicar"
                    : "Choose the grant category you wish to apply for"}
                </h3>
                <div className="live-grid grant-categories">
                  {call.rules.categories.map((category) => (
                    <form
                      className="live-card"
                      key={category.id}
                      action={createDraft}
                    >
                      <input type="hidden" name="call_id" value={call.id} />
                      <input
                        type="hidden"
                        name="category_id"
                        value={category.id}
                      />
                      <h3>{es ? category.label_es : category.label_en}</h3>
                      <p>
                        USD {category.min_amount.toLocaleString(locale)} –{" "}
                        {category.max_amount?.toLocaleString(locale) ??
                          (es ? "según las bases" : "see call rules")}
                      </p>
                      <p>
                        {es ? "Duración máxima: " : "Maximum duration: "}
                        <strong>
                          {category.max_months} {es ? "meses" : "months"}
                        </strong>
                      </p>
                      <p>
                        {category.cofinance_percent === 0
                          ? es
                            ? "Cofinanciamiento no obligatorio según estas bases."
                            : "Co-financing is optional under these rules."
                          : (es
                              ? "Cofinanciamiento mínimo: "
                              : "Minimum co-financing: ") +
                            category.cofinance_percent +
                            "%"}
                      </p>
                      <button className="button primary">
                        {es
                          ? "Preparar nota conceptual"
                          : "Prepare concept note"}
                      </button>
                    </form>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p>
            {es
              ? "No hay convocatorias abiertas para recibir postulaciones."
              : "No calls are currently open for applications."}
          </p>
        )}
      </section>
    </Shell>
  );
}
