/** Entry rules only; persisted amounts remain numbers in USD. */
export type MoneyEntry =
  { valid: true; value: number | null } | { valid: false; value: null };

export const maximumMoneyAmount = 999999999999.99;

export type MoneyInspection =
  | { kind: "empty" }
  | { kind: "format" }
  | { kind: "amount"; value: number; supported: boolean };

/** Inspect range separately from syntax so a large integer is never called a decimal error. */
export function inspectMoneyEntry(input: string): MoneyInspection {
  const raw = input.trim();
  if (!raw) return { kind: "empty" };
  let canonical = raw;
  // Grouped pasted amounts need an explicit decimal part to be unambiguous.
  if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(raw))
    canonical = raw.replaceAll(".", "").replace(",", ".");
  else if (/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(raw))
    canonical = raw.replaceAll(",", "");
  else if (/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(raw))
    canonical = raw.replace(",", ".");
  else return { kind: "format" };

  const [whole = "", fraction = ""] = canonical.split(".");
  // Build cents from decimal digits, without floating-point multiplication.
  const cents = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
  return {
    kind: "amount",
    value: cents / 100,
    supported: Number.isSafeInteger(cents) && cents <= 99999999999999,
  };
}

export function parseMoneyEntry(input: string): MoneyEntry {
  const entry = inspectMoneyEntry(input);
  if (entry.kind === "empty") return { valid: true, value: null };
  return entry.kind === "amount" && entry.supported
    ? { valid: true, value: entry.value }
    : { valid: false, value: null };
}

export function formatMoneyEntry(value: number | null, locale: "es" | "en") {
  if (value === null) return "";
  return value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    // Do not silently round a historical value that has more decimal places.
    maximumFractionDigits: 20,
  });
}

export function moneyEntryError(locale: "es" | "en", input?: string) {
  const entry = input === undefined ? undefined : inspectMoneyEntry(input);
  if (entry?.kind === "amount" && !entry.supported) {
    const limit = maximumMoneyAmount.toLocaleString(locale, {
      style: "currency",
      currency: "USD",
    });
    return locale === "es"
      ? `El importe supera el límite numérico admitido por el sistema (${limit}). Revise el valor ingresado.`
      : `The amount exceeds the system's supported numeric limit (${limit}). Check the entered value.`;
  }
  return locale === "es"
    ? "Ingrese un importe válido con hasta dos decimales. Para evitar confusiones, escriba sin separadores de miles; por ejemplo, 12500,50 o 12500.50."
    : "Enter a valid amount with up to two decimal places. To avoid ambiguity, omit thousands separators; for example, 12500.50 or 12500,50.";
}
