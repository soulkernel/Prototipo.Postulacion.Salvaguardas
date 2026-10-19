"use client";

import { useState } from "react";
import { formatMoneyEntry, parseMoneyEntry } from "../lib/money-input";

/** Preserve in-progress decimal separators and zeros across parent/autosave renders. */
export function MoneyInput({
  id,
  value,
  locale,
  invalid,
  describedBy,
  readOnly = false,
  onChange,
  onValidity,
  onFocus,
  onBlur,
}: {
  id: string;
  value: number | null;
  locale: "es" | "en";
  invalid: boolean;
  describedBy?: string;
  readOnly?: boolean;
  onChange: (value: number | null) => void;
  onValidity: (valid: boolean, text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const [raw, setRaw] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const entry = raw === null ? null : parseMoneyEntry(raw);
  const malformed = !readOnly && changed && entry?.valid === false;
  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        aria-required="true"
        aria-invalid={Boolean(malformed || invalid)}
        aria-describedby={describedBy}
        placeholder={locale === "es" ? "Ej.: 12500,50" : "e.g. 12500.50"}
        value={
          readOnly
            ? formatMoneyEntry(value, locale)
            : (raw ?? formatMoneyEntry(value, locale))
        }
        onFocus={onFocus}
        onChange={(event) => {
          if (readOnly) return;
          const text = event.target.value;
          const parsed = parseMoneyEntry(text);
          setRaw(text);
          setChanged(true);
          onValidity(parsed.valid, text);
          if (parsed.valid) onChange(parsed.value);
        }}
        onBlur={() => {
          // Formatting changes presentation only, never the stored amount.
          if (!changed || entry?.valid) {
            setRaw(null);
            setChanged(false);
          }
          onBlur();
        }}
      />
    </>
  );
}
