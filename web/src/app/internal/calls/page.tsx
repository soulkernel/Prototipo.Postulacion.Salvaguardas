import Link from "next/link";
import { requireViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { createCall, publishCall } from "../actions";
export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireViewer(["grants_manager", "administrator"]);
  const locale = await getLocale();
  const es = locale === "es";
  const calls = await getCalls();
  const params = await searchParams;
  return (
    <Shell locale={locale} internal>
      <Link href="/internal">← {es ? "Panel interno" : "Staff workspace"}</Link>
      <h1>{es ? "Convocatorias" : "Calls"}</h1>
      {params.error && (
        <p className="auth-error" role="alert">
          {es
            ? "Revise los parámetros y complete ambas versiones de idioma antes de publicar."
            : "Review the parameters and complete both languages before publishing."}{" "}
          <code>{params.error}</code>
        </p>
      )}
      <div className="live-grid">
        {calls.map((c) => (
          <section className="live-card" key={c.id}>
            <span className="eyebrow">
              {c.code} · {c.status}
            </span>
            <h2>{es ? c.title_es : c.title_en}</h2>
            <p>
              {es ? "Versión de reglas" : "Rules version"} {c.rules_version}
            </p>
            {c.status === "draft" && (
              <form action={publishCall}>
                <input type="hidden" name="id" value={c.id} />
                <button className="button primary">
                  {es ? "Publicar convocatoria" : "Publish call"}
                </button>
              </form>
            )}
          </section>
        ))}
      </div>
      <section className="live-card">
        <h2>{es ? "Preparar nueva convocatoria" : "Prepare a new call"}</h2>
        <form action={createCall} className="live-form">
          <div className="live-grid">
            {[
              ["code", "Código / Code"],
              ["rules_version", "Versión de bases / Rules version"],
              ["title_es", "Título en español"],
              ["title_en", "Title in English"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input name={name} required maxLength={200} />
              </label>
            ))}
            <label>
              {es ? "Apertura (hora Galápagos)" : "Opens (Galápagos time)"}
              <input type="datetime-local" name="opens_at" required />
            </label>
            <label>
              {es ? "Cierre (hora Galápagos)" : "Closes (Galápagos time)"}
              <input type="datetime-local" name="closes_at" required />
            </label>
          </div>
          <label>
            Descripción en español
            <textarea name="description_es" required />
          </label>
          <label>
            Description in English
            <textarea name="description_en" required />
          </label>
          <h3>
            {es ? "Tipos de solicitante admitidos" : "Eligible applicant types"}
          </h3>
          <label className="check-row">
            <input type="checkbox" name="applicant_types" value="individual" />
            {es ? "Personas naturales" : "Individuals"}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              name="applicant_types"
              value="organization"
            />
            {es
              ? "Personas jurídicas / organizaciones"
              : "Legal entities / organizations"}
          </label>
          <h3>
            {es
              ? "Categorías: confirme valores según las bases vigentes"
              : "Categories: confirm values against the current call rules"}
          </h3>
          {[
            ["small", "Pequeña", "Small", 0, 100000, 12, 0],
            ["medium", "Mediana", "Medium", 100000, 250000, 24, 10],
            ["large", "Grande", "Large", 250000, "", 36, 25],
          ].map(([id, esName, enName, min, max, months, cofinance]) => (
            <fieldset className="activity-card" key={String(id)}>
              <legend>{es ? esName : enName}</legend>
              <label className="check-row">
                <input type="checkbox" name={id + "_enabled"} defaultChecked />
                {es ? "Habilitar categoría" : "Enable category"}
              </label>
              <div className="live-grid">
                {[
                  ["es", "Nombre ES", esName],
                  ["en", "Name EN", enName],
                  ["min", es ? "Monto mínimo USD" : "Minimum USD", min],
                  [
                    "max",
                    es
                      ? "Monto máximo USD (vacío = sin tope)"
                      : "Maximum USD (empty = no cap)",
                    max,
                  ],
                  [
                    "months",
                    es ? "Plazo máximo en meses" : "Maximum term in months",
                    months,
                  ],
                  [
                    "cofinance",
                    es ? "Cofinanciamiento mínimo %" : "Minimum cofinancing %",
                    cofinance,
                  ],
                ].map(([key, label, value]) => (
                  <label key={String(key)}>
                    {label}
                    <input
                      name={id + "_" + key}
                      type={
                        ["es", "en"].includes(String(key)) ? "text" : "number"
                      }
                      defaultValue={value}
                      min="0"
                      max={
                        key === "months"
                          ? 36
                          : key === "cofinance"
                            ? 100
                            : undefined
                      }
                      step="any"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="live-grid">
            <label>
              {es ? "Límite de palabras del resumen" : "Summary word limit"}
              <input
                type="number"
                min="1"
                max="5000"
                name="word_limit"
                defaultValue="500"
                required
              />
            </label>
            <label>
              {es
                ? "Tope de gastos administrativos %"
                : "Administrative expenses cap %"}
              <input
                type="number"
                min="0"
                max="100"
                name="admin_percent"
                defaultValue="10"
                required
              />
            </label>
          </div>
          <label>
            {es
              ? "Anexos obligatorios: un nombre por línea"
              : "Required attachments: one name per line"}
            <textarea name="attachments" />
          </label>
          <label>
            Aviso de privacidad en español
            <textarea name="privacy_es" required />
          </label>
          <label>
            Privacy notice in English
            <textarea name="privacy_en" required />
          </label>
          <details>
            <summary>
              {es
                ? "Campos oficiales del proyecto completo (Fase 2)"
                : "Official full proposal fields (Phase 2)"}
            </summary>
            <p>
              {es
                ? "Consigne un apartado por línea en ambos idiomas y en el mismo orden. Deje ambos vacíos hasta validar el formato oficial; no se emitirán invitaciones sin ese formato configurado."
                : "Enter one section per line in both languages, in the same order. Leave both empty until the official format is validated; invitations cannot be issued without it."}
            </p>
            <div className="live-grid">
              <label>
                Apartados en español
                <textarea name="phase2_es" />
              </label>
              <label>
                Sections in English
                <textarea name="phase2_en" />
              </label>
            </div>
          </details>
          <button className="button primary">
            {es ? "Guardar convocatoria en borrador" : "Save call as draft"}
          </button>
        </form>
      </section>
    </Shell>
  );
}
