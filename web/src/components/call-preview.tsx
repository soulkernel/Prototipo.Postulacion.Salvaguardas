import type { Call, Locale } from "@/lib/domain";
export function CallPreview({
  call: c,
  locale,
}: {
  call: Call;
  locale: Locale;
}) {
  const es = locale === "es";
  const empty = es ? "Pendiente de completar" : "Not yet completed";
  const date = (v: string | null) =>
    v
      ? new Intl.DateTimeFormat(es ? "es-EC" : "en-US", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Pacific/Galapagos",
        }).format(new Date(v))
      : empty;
  const money = (n: number) =>
    new Intl.NumberFormat(es ? "es-EC" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  return (
    <article className="call-preview">
      <p className="eyebrow">
        Galápagos Life Fund · {c.code} · {es ? "Bases" : "Rules"}{" "}
        {c.rules_version || empty}
      </p>
      <h2>{(es ? c.title_es : c.title_en) || empty}</h2>
      <p className="call-preserve-lines">
        {(es ? c.description_es : c.description_en) || empty}
      </p>
      <dl>
        <dt>{es ? "Apertura" : "Opening"}</dt>
        <dd>{date(c.opens_at)} (Galápagos)</dd>
        <dt>{es ? "Cierre" : "Closing"}</dt>
        <dd>{date(c.closes_at)} (Galápagos)</dd>
      </dl>
      <h3>{es ? "Quiénes pueden postular" : "Eligible applicants"}</h3>
      <ul>
        {c.rules.applicant_types.map((t) => (
          <li key={t}>
            {t === "individual"
              ? es
                ? "Personas naturales"
                : "Individuals"
              : es
                ? "Personas jurídicas / organizaciones"
                : "Legal entities / organizations"}
          </li>
        ))}
      </ul>
      {!c.rules.applicant_types.length && <p>{empty}</p>}
      <h3>{es ? "Categorías de subvención" : "Grant categories"}</h3>
      <div className="live-grid grant-categories">
        {c.rules.categories.map((cat) => (
          <section className="live-card" key={cat.id}>
            <h3>{(es ? cat.label_es : cat.label_en) || empty}</h3>
            <p>
              {money(cat.min_amount)} –{" "}
              {cat.max_amount === null
                ? es
                  ? "sin tope definido"
                  : "no defined cap"
                : money(cat.max_amount)}
            </p>
            <p>
              {es ? "Duración máxima" : "Maximum duration"}: {cat.max_months}{" "}
              {es ? "meses" : "months"}
            </p>
            <p>
              {es ? "Cofinanciamiento mínimo" : "Minimum cofinancing"}:{" "}
              {cat.cofinance_percent}%
            </p>
          </section>
        ))}
      </div>
      {!c.rules.categories.length && <p>{empty}</p>}
      <h3>
        {es ? "Requisitos de la nota conceptual" : "Concept note requirements"}
      </h3>
      <p>
        {es ? "Límite del resumen" : "Summary limit"}:{" "}
        {c.rules.summary_word_limit} {es ? "palabras" : "words"} ·{" "}
        {es ? "Tope administrativo" : "Administrative cap"}:{" "}
        {c.rules.max_admin_percent}%
      </p>
      <h3>{es ? "Anexos obligatorios" : "Required attachments"}</h3>
      {c.rules.required_attachments.length ? (
        <ul>
          {c.rules.required_attachments.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : (
        <p>
          {es
            ? "No se han definido anexos adicionales."
            : "No additional attachments have been defined."}
        </p>
      )}
      <h3>{es ? "Aviso de privacidad" : "Privacy notice"}</h3>
      <p className="call-preserve-lines">
        {(es ? c.rules.privacy_es : c.rules.privacy_en) || empty}
      </p>
      {c.phase2_schema.length > 0 && (
        <>
          <h3>
            {es
              ? "Proyecto completo — exclusivamente para seleccionados"
              : "Full proposal — selected applicants only"}
          </h3>
          <ul>
            {c.phase2_schema.map((f) => (
              <li key={f.id}>{(es ? f.label_es : f.label_en) || empty}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
