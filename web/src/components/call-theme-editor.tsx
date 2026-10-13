"use client";
import { useState } from "react";
import { themeOptionsSchema, type CallTheme } from "@/lib/call-themes";
import type { Locale } from "@/lib/domain";

export function CallThemeEditor({
  initialOptions,
  selected,
  locale,
  onEdit,
  initialEditor,
}: {
  initialOptions: CallTheme[];
  selected: string[];
  locale: Locale;
  onEdit: () => void;
  initialEditor?: { id: string; spanish: string; english: string };
}) {
  const es = locale === "es";
  const [options, setOptions] = useState(initialOptions);
  const [checked, setChecked] = useState(selected);
  const [editing, setEditing] = useState<string | null>(
    initialEditor?.id ?? null,
  );
  const [spanish, setSpanish] = useState(initialEditor?.spanish ?? "");
  const [english, setEnglish] = useState(initialEditor?.english ?? "");
  const [error, setError] = useState("");
  const reset = () => {
    setEditing(null);
    setSpanish("");
    setEnglish("");
    setError("");
  };
  function apply() {
    const row = {
      id: editing === "new" ? `custom_${crypto.randomUUID()}` : editing!,
      label_es: spanish.trim(),
      label_en: english.trim(),
    };
    const next =
      editing === "new"
        ? [...options, row]
        : options.map((t) => (t.id === editing ? row : t));
    const result = themeOptionsSchema.safeParse(next);
    if (!result.success) {
      setError(
        es
          ? "Complete ambos nombres (máximo 200 caracteres), sin repetir una línea existente en ninguno de los idiomas. Se admiten hasta 50 líneas."
          : "Complete both names (up to 200 characters), without duplicating an existing theme in either language. Up to 50 themes are allowed.",
      );
      return;
    }
    setOptions(result.data);
    if (editing === "new") setChecked([...checked, row.id]);
    onEdit();
    reset();
  }
  return (
    <fieldset className="call-theme-editor">
      <legend>
        {es ? "Líneas temáticas de esta convocatoria" : "Themes for this call"}
      </legend>
      <input
        type="hidden"
        name="theme_options"
        value={JSON.stringify(options)}
      />
      <input
        type="hidden"
        name="theme_editor_pending"
        value={editing ? "true" : "false"}
      />
      <input type="hidden" name="theme_edit_id" value={editing ?? ""} />
      {options.map((t) => (
        <div className="call-theme-row" key={t.id}>
          <label className="check-row">
            <input
              type="checkbox"
              name="themes"
              value={t.id}
              checked={checked.includes(t.id)}
              onChange={(e) => {
                setChecked(
                  e.target.checked
                    ? [...checked, t.id]
                    : checked.filter((id) => id !== t.id),
                );
                onEdit();
              }}
            />
            {es ? t.label_es : t.label_en}
          </label>
          {t.id.startsWith("custom_") && (
            <div className="live-actions">
              <button
                type="button"
                className="button secondary"
                aria-label={`${es ? "Editar línea temática" : "Edit theme"}: ${es ? t.label_es : t.label_en}`}
                disabled={editing !== null}
                onClick={() => {
                  setEditing(t.id);
                  setSpanish(t.label_es);
                  setEnglish(t.label_en);
                  setError("");
                  onEdit();
                }}
              >
                {es ? "Editar" : "Edit"}
              </button>
              <button
                type="button"
                className="button secondary"
                aria-label={`${es ? "Quitar línea temática" : "Remove theme"}: ${es ? t.label_es : t.label_en}`}
                disabled={editing !== null}
                onClick={() => {
                  setOptions(options.filter((o) => o.id !== t.id));
                  setChecked(checked.filter((id) => id !== t.id));
                  onEdit();
                }}
              >
                {es ? "Quitar" : "Remove"}
              </button>
            </div>
          )}
        </div>
      ))}
      {editing ? (
        <div className="call-theme-entry">
          <div className="live-grid">
            <label>
              {es ? "Nombre de la línea en español" : "Theme name in Spanish"}
              <input
                name="theme_edit_es"
                lang="es"
                spellCheck
                maxLength={200}
                value={spanish}
                onChange={(e) => setSpanish(e.target.value)}
              />
            </label>
            <label>
              {es ? "Nombre de la línea en inglés" : "Theme name in English"}
              <input
                name="theme_edit_en"
                lang="en"
                spellCheck
                maxLength={200}
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
              />
            </label>
          </div>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <div className="live-actions">
            <button type="button" className="button primary" onClick={apply}>
              {editing === "new"
                ? es
                  ? "Agregar"
                  : "Add"
                : es
                  ? "Aplicar cambios"
                  : "Apply changes"}
            </button>
            <button type="button" className="button secondary" onClick={reset}>
              {es ? "Cancelar" : "Cancel"}
            </button>
          </div>
          <p className="field-help">
            {es
              ? "Agregue o cancele esta línea antes de guardar la convocatoria."
              : "Add or cancel this theme before saving the call."}
          </p>
        </div>
      ) : (
        <button
          type="button"
          className="button secondary"
          disabled={options.length >= 50}
          onClick={() => {
            setEditing("new");
            onEdit();
          }}
        >
          + {es ? "Agregar línea temática" : "Add theme"}
        </button>
      )}
    </fieldset>
  );
}
