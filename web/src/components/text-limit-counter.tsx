import type { Locale } from "@/lib/domain";

export function TextLimitCounter({
  count,
  limit,
  locale,
  unit = "characters",
  id,
  live,
}: {
  count: number;
  limit: number;
  locale: Locale;
  unit?: "characters" | "words";
  id?: string;
  live?: "polite";
}) {
  const es = locale === "es";
  const format = (value: number) =>
    value.toLocaleString(locale, { useGrouping: true });
  const units =
    unit === "words"
      ? es
        ? "palabras permitidas"
        : "words allowed"
      : es
        ? "caracteres permitidos"
        : "characters allowed";
  const remaining = Math.max(0, limit - count);
  const exceeded = count - limit;
  return (
    <small id={id} className="text-limit" aria-live={live}>
      {format(count)} {es ? "de" : "of"} {format(limit)} {units} ·{" "}
      {exceeded > 0
        ? es
          ? `Excede el límite en ${format(exceeded)}.`
          : `Limit exceeded by ${format(exceeded)}.`
        : `${format(remaining)} ${es ? (remaining === 1 ? "disponible" : "disponibles") : "remaining"}`}
    </small>
  );
}
