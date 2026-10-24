"use client";
import { useState } from "react";
import type { Locale } from "@/lib/domain";
import type { CallCodeSuggestions } from "@/lib/call-codes";
export function CallCodeField({
  defaultCode,
  suggestions,
  locale,
  onEdit,
  defaultSeries,
}: {
  defaultCode: string;
  suggestions: CallCodeSuggestions;
  locale: Locale;
  onEdit: () => void;
  defaultSeries?: "official" | "test";
}) {
  const es = locale === "es";
  const [code, setCode] = useState(defaultCode || suggestions.official);
  const [series, setSeries] = useState<"official" | "test">(
    defaultSeries ??
      (defaultCode.startsWith("GLF-PRUEBA-") ? "test" : "official"),
  );
  return (
    <div className="call-code-field">
      <label>
        {es ? "Serie del código" : "Code series"}
        <select
          name="code_series"
          value={series}
          onChange={(e) => {
            const selected = e.target.value as "official" | "test";
            setSeries(selected);
            setCode(suggestions[selected]);
            onEdit();
          }}
        >
          <option value="official">
            {es ? "Convocatoria oficial" : "Official call"}
          </option>
          <option value="test">
            {es ? "Prueba interna" : "Internal test"}
          </option>
        </select>
      </label>
      <label>
        {es ? "Código de convocatoria" : "Call code"}
        <input
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={200}
          aria-describedby="call-code-help"
          required
        />
      </label>
      <p id="call-code-help">
        {es
          ? "Código sugerido automáticamente. Puede modificarlo antes de publicar. Se comprobará que no esté repetido al guardar. La serie de prueba tiene numeración independiente."
          : "Automatically suggested code. You can edit it before publishing. Uniqueness will be checked when saving. The test series has its own numbering."}
      </p>
      <button
        type="button"
        className="button secondary"
        onClick={() => {
          setCode(suggestions[series]);
          onEdit();
        }}
      >
        {es ? "Usar código sugerido" : "Use suggested code"}
      </button>
    </div>
  );
}
