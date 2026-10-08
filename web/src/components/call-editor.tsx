"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import type { Call, Locale } from "@/lib/domain";
import { callIssues, callFormValues } from "@/lib/calls";
import { saveOrPublishCall } from "@/app/internal/calls/actions";
import { ActionLabel } from "@/components/submit-button";
import { CallPreview } from "@/components/call-preview";
import { CallCodeField } from "@/components/call-code-field";
import type { CallCodeSuggestions } from "@/lib/call-codes";
export function CallEditor({
  initialCall,
  locale,
  now,
  codeSuggestions,
}: {
  initialCall: Call | null;
  locale: Locale;
  now: number;
  codeSuggestions: CallCodeSuggestions;
}) {
  const es = locale === "es";
  const [state, action, pending] = useActionState(saveOrPublishCall, {
    call: initialCall,
    saved: !!initialCall,
    sequence: 0,
  });
  const [dirtySequence, setDirtySequence] = useState(-1);
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [previewLocale, setPreviewLocale] = useState(locale);
  const call = state.call;
  const dirty = !state.saved || dirtySequence === state.sequence;
  const values = state.values ?? (call ? callFormValues(call) : {});
  const field = (name: string, fallback = "") =>
    String(values[name] ?? fallback);
  const checked = (name: string, value: string, fallback = false) =>
    values[name] === undefined
      ? fallback
      : Array.isArray(values[name])
        ? (values[name] as string[]).includes(value)
        : values[name] === value;
  const issues = call ? callIssues(call, locale, now) : [];
  const canPublish = call?.status === "draft" && !dirty && !issues.length;
  const missingField = (name: string) =>
    !dirty && call && !field(name).trim() ? (
      <span className="auth-error">
        {es
          ? "Complete este campo para publicar."
          : "Complete this field before publishing."}
      </span>
    ) : null;
  return (
    <section className="live-card call-editor">
      <h2>
        {call
          ? es
            ? "Editar convocatoria"
            : "Edit call"
          : es
            ? "Preparar nueva convocatoria"
            : "Prepare a new call"}
      </h2>
      <p>
        {es
          ? "Puede guardar un borrador incompleto. El sistema sugiere un código que puede modificar antes de publicar. La publicación exige completar todos los parámetros obligatorios."
          : "You can save an incomplete draft. The system suggests a code you can edit before publishing. Publishing requires all mandatory parameters."}
      </p>
      <form
        key={state.sequence}
        action={action}
        className="live-form"
        noValidate
        onChange={() => setDirtySequence(state.sequence)}
      >
        <input type="hidden" name="id" value={call?.id ?? ""} />
        <input type="hidden" name="revision" value={call?.revision ?? 0} />
        <fieldset
          disabled={pending || call?.status === "published"}
          className="call-fields"
        >
          <CallCodeField
            defaultCode={field("code")}
            suggestions={codeSuggestions}
            locale={locale}
            onEdit={() => setDirtySequence(state.sequence)}
            defaultSeries={
              values.code_series === "test"
                ? "test"
                : values.code_series === "official"
                  ? "official"
                  : undefined
            }
          />
          <div className="live-grid">
            {[
              ["rules_version", "Versión de bases / Rules version"],
              ["title_es", "Título en español"],
              ["title_en", "Title in English"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  defaultValue={field(name)}
                  maxLength={200}
                  aria-invalid={!dirty && !!call && !field(name).trim()}
                />
                {missingField(name)}
              </label>
            ))}
            <label>
              {es
                ? "Apertura (fecha y hora Galápagos)"
                : "Opens (Galápagos date and time)"}
              <input
                type="datetime-local"
                name="opens_at"
                defaultValue={field("opens_at")}
              />
              {missingField("opens_at")}
            </label>
            <label>
              {es
                ? "Cierre (fecha y hora Galápagos)"
                : "Closes (Galápagos date and time)"}
              <input
                type="datetime-local"
                name="closes_at"
                defaultValue={field("closes_at")}
              />
              {missingField("closes_at")}
            </label>
          </div>
          <label>
            Descripción en español
            <textarea
              name="description_es"
              defaultValue={field("description_es")}
            />
            {missingField("description_es")}
          </label>
          <label>
            Description in English
            <textarea
              name="description_en"
              defaultValue={field("description_en")}
            />
            {missingField("description_en")}
          </label>
          <h3>
            {es ? "Tipos de solicitante admitidos" : "Eligible applicant types"}
          </h3>
          <label className="check-row">
            <input
              type="checkbox"
              name="applicant_types"
              value="individual"
              defaultChecked={checked("applicant_types", "individual")}
            />
            {es ? "Personas naturales" : "Individuals"}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              name="applicant_types"
              value="organization"
              defaultChecked={checked("applicant_types", "organization")}
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
                <input
                  type="checkbox"
                  name={id + "_enabled"}
                  defaultChecked={checked(String(id) + "_enabled", "on", !call)}
                />
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
                      defaultValue={field(
                        String(id) + "_" + key,
                        String(value),
                      )}
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
                defaultValue={field("word_limit", "500")}
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
                defaultValue={field("admin_percent", "10")}
                required
              />
            </label>
          </div>
          <label>
            {es
              ? "Anexos obligatorios: un nombre por línea"
              : "Required attachments: one name per line"}
            <textarea name="attachments" defaultValue={field("attachments")} />
          </label>
          <label>
            Aviso de privacidad en español
            <textarea name="privacy_es" defaultValue={field("privacy_es")} />
            {missingField("privacy_es")}
          </label>
          <label>
            Privacy notice in English
            <textarea name="privacy_en" defaultValue={field("privacy_en")} />
            {missingField("privacy_en")}
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
                <textarea name="phase2_es" defaultValue={field("phase2_es")} />
              </label>
              <label>
                Sections in English
                <textarea name="phase2_en" defaultValue={field("phase2_en")} />
              </label>
            </div>
          </details>
        </fieldset>
        <div className="call-actions">
          <button
            className="button primary"
            disabled={pending || call?.status === "published"}
          >
            <ActionLabel
              busy={pending}
              pendingLabel={es ? "Guardando…" : "Saving…"}
            >
              {es ? "Guardar borrador" : "Save draft"}
            </ActionLabel>
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!call || dirty || pending}
            onClick={() => {
              setPreviewLocale(locale);
              setPreview(true);
            }}
          >
            {es ? "Vista previa" : "Preview"}
          </button>
          <button
            type="button"
            className="button primary"
            disabled={!canPublish || pending}
            onClick={() => setConfirm(true)}
          >
            {es ? "Publicar convocatoria" : "Publish call"}
          </button>
        </div>
        <div aria-live="polite">
          {state.error && (
            <p role="alert" className="auth-error">
              {state.error}
            </p>
          )}
          <p>
            {call?.status === "published"
              ? es
                ? "Convocatoria publicada."
                : "Call published."
              : dirty
                ? es
                  ? "Guarde el borrador para revisar y publicar la versión actual."
                  : "Save the draft to preview and publish the current version."
                : es
                  ? "Borrador guardado. Revise la vista previa antes de publicar."
                  : "Draft saved. Review the preview before publishing."}
          </p>
          {issues.length > 0 && !dirty && call?.status === "draft" && (
            <div className="call-validation">
              <strong>
                {es
                  ? "Para publicar, complete lo siguiente:"
                  : "Before publishing, complete the following:"}
              </strong>
              <ul>
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
      {preview && call && (
        <dialog
          ref={(node) => {
            if (node && !node.open) node.showModal();
          }}
          onCancel={() => setPreview(false)}
          className="call-dialog"
          aria-labelledby="call-preview-title"
        >
          <div className="call-dialog-content">
            <h2 id="call-preview-title">
              {es
                ? "Vista previa — convocatoria sin publicar"
                : "Preview — unpublished call"}
            </h2>
            <div className="call-actions">
              <button
                className="button secondary"
                onClick={() => setPreviewLocale("es")}
                aria-pressed={previewLocale === "es"}
              >
                Español
              </button>
              <button
                className="button secondary"
                onClick={() => setPreviewLocale("en")}
                aria-pressed={previewLocale === "en"}
              >
                English
              </button>
              <button
                className="button primary"
                onClick={() => setPreview(false)}
              >
                {es ? "Volver a editar" : "Back to editing"}
              </button>
            </div>
            <CallPreview call={call} locale={previewLocale} />
          </div>
        </dialog>
      )}
      {confirm && canPublish && call && (
        <dialog
          ref={(node) => {
            if (node && !node.open) node.showModal();
          }}
          onCancel={() => setConfirm(false)}
          className="call-dialog"
          aria-labelledby="call-confirm-title"
        >
          <div className="call-dialog-content">
            <h2 id="call-confirm-title">
              {es ? "Confirmar publicación" : "Confirm publication"}
            </h2>
            <p>
              {es
                ? "La convocatoria estará disponible para postular dentro del periodo indicado. Esta acción no envía correos ni publica anuncios externos. Una vez publicada, este formulario ya no permite modificar sus bases."
                : "Applications will be accepted during the specified period. This does not send emails or publish external announcements. Once published, this form no longer allows editing its rules."}
            </p>
            <CallPreview call={call} locale={locale} />
            <form action={action}>
              <input type="hidden" name="operation" value="publish" />
              <input type="hidden" name="id" value={call.id} />
              <input type="hidden" name="revision" value={call.revision} />
              <label className="check-row">
                <input
                  type="checkbox"
                  name="confirmed"
                  required
                  disabled={pending}
                />
                {es
                  ? "He revisado los datos y autorizo publicar esta convocatoria."
                  : "I have reviewed the details and authorize publishing this call."}
              </label>
              <div className="call-actions">
                <button
                  className="button secondary"
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirm(false)}
                >
                  {es ? "Volver a editar" : "Back to editing"}
                </button>
                <button className="button primary" disabled={pending}>
                  <ActionLabel
                    busy={pending}
                    pendingLabel={es ? "Publicando…" : "Publishing…"}
                  >
                    {es ? "Confirmar y publicar" : "Confirm and publish"}
                  </ActionLabel>
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
      {call?.status === "published" && (
        <Link className="button secondary" href="/internal/calls">
          {es ? "Volver a convocatorias" : "Back to calls"}
        </Link>
      )}
    </section>
  );
}
