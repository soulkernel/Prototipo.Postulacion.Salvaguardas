/** Entry rules only; persisted amounts remain numbers in USD. */
export type MoneyEntry =
  { valid: true; value: number | null } | { valid: false; value: null };

export function parseMoneyEntry(input: string): MoneyEntry {
  const raw = input.trim();
  if (!raw) return { valid: true, value: null };
  let canonical = raw;
  // Grouped pasted amounts need an explicit decimal part to be unambiguous.
  if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(raw))
    canonical = raw.replaceAll(".", "").replace(",", ".");
  else if (/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(raw))
    canonical = raw.replaceAll(",", "");
  else if (/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(raw))
    canonical = raw.replace(",", ".");
  else return { valid: false, value: null };

  const [whole = "", fraction = ""] = canonical.split(".");
  // Build cents from decimal digits, without floating-point multiplication.
  const cents = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 99999999999999)
    return { valid: false, value: null };
  return { valid: true, value: cents / 100 };
}

export function formatMoneyEntry(value: number | null, locale: "es" | "en") {
  if (value === null) return "";
  return value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    // Do not silently round a historical value that has more decimal places.
    maximumFractionDigits: 20,
  });
}

export function moneyEntryError(locale: "es" | "en") {
  return locale === "es"
    ? "Ingrese un importe válido con hasta dos decimales. Para evitar confusiones, escriba sin separadores de miles; por ejemplo, 12500,50 o 12500.50."
    : "Enter a valid amount with up to two decimal places. To avoid ambiguity, omit thousands separators; for example, 12500.50 or 12500,50.";
}
