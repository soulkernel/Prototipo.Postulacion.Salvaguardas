import type { Locale } from "./domain";

export function documentStamp(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Invalid document date");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Galapagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (key: string) => parts.find((p) => p.type === key)!.value;
  return `${get("year")}-${get("month")}-${get("day")}_${get("hour")}${get("minute")}${get("second")}`;
}

export function documentFilename(
  reference: string,
  kind: "concept" | "matrix",
  revision: number,
  generatedAt: string,
  locale: Locale,
) {
  const safeReference = reference.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 100);
  const label =
    kind === "concept"
      ? locale === "es"
        ? "Nota-conceptual"
        : "Concept-note"
      : locale === "es"
        ? "Evaluacion-AS"
        : "ES-assessment";
  return `${safeReference}_${label}_v${revision}_${documentStamp(generatedAt)}_Galapagos_${locale}.pdf`;
}
