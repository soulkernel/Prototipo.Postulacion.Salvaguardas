export type CallCodeSuggestions = { official: string; test: string };
export function suggestCallCodes(
  codes: readonly string[],
  now: number,
): CallCodeSuggestions {
  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "Pacific/Galapagos",
  }).format(new Date(now));
  const next = (test: boolean) => {
    const prefix = `GLF-${test ? "PRUEBA-" : ""}${year}-`;
    let maximum = BigInt(0);
    for (const original of codes) {
      const code = original.trim().toUpperCase();
      if (!code.startsWith(prefix)) continue;
      const suffix = code.slice(prefix.length);
      if (!/^\d{3,}$/.test(suffix)) continue;
      const value = BigInt(suffix);
      if (value > maximum) maximum = value;
    }
    return prefix + (maximum + BigInt(1)).toString().padStart(3, "0");
  };
  return { official: next(false), test: next(true) };
}
