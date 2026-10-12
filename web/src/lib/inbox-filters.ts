import type { Call, Locale } from "./domain";

export function defaultCall(calls: Call[], now = Date.now()) {
  const published = calls
    .filter((c) => c.status === "published")
    .sort(
      (a, b) =>
        (Date.parse(b.opens_at || "") || 0) -
        (Date.parse(a.opens_at || "") || 0),
    );
  return (
    published.find(
      (c) =>
        c.opens_at &&
        c.closes_at &&
        Date.parse(c.opens_at) <= now &&
        now <= Date.parse(c.closes_at),
    )?.id ||
    published[0]?.id ||
    "all"
  );
}
export function categoryOptions(calls: Call[], locale: Locale) {
  return [
    ...new Map(
      calls.flatMap((c) =>
        c.rules.categories.map(
          (k) =>
            [
              k.id,
              { id: k.id, title: locale === "es" ? k.label_es : k.label_en },
            ] as const,
        ),
      ),
    ).values(),
  ];
}
export function resolveFilters(
  calls: Call[],
  query: { call?: string; category?: string },
  locale: Locale,
) {
  const call =
    query.call === "all" || calls.some((c) => c.id === query.call)
      ? query.call!
      : defaultCall(calls);
  const options = categoryOptions(calls, locale);
  const category = options.some((c) => c.id === query.category)
    ? query.category!
    : "all";
  return { call, category, options };
}
