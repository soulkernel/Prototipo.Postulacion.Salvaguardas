import data from "./exclusion-list-data.json";
import type { Locale } from "./domain";

export const exclusionSource = data.source;
export const exclusionNotes = data.notes;
export const exclusionEntries = data.entries;
export type ExclusionEntry = (typeof exclusionEntries)[number];

// Editorial navigation only: these topics do not define new exclusions.
export const exclusionTopics = [
  {
    id: "nature",
    es: "Biodiversidad y áreas protegidas",
    en: "Biodiversity and protected areas",
  },
  { id: "fishing", es: "Pesca", en: "Fishing" },
  {
    id: "materials",
    es: "Sustancias y materiales",
    en: "Substances and materials",
  },
  { id: "rights", es: "Derechos y trabajo", en: "Rights and labour" },
  { id: "legality", es: "Legalidad y conducta", en: "Legality and conduct" },
  { id: "other", es: "Otras actividades", en: "Other activities" },
] as const;

export function normalizeExclusionText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function exclusionSearchTerms(query: string): string[] {
  return [
    ...new Set(
      normalizeExclusionText(query).trim().split(/\s+/).filter(Boolean),
    ),
  ];
}

export function filterExclusions(
  query: string,
  topic = "all",
): ExclusionEntry[] {
  const terms = exclusionSearchTerms(query);
  return exclusionEntries.filter((entry) => {
    if (topic !== "all" && !entry.topics.includes(topic)) return false;
    const noteIds = [
      ...entry.notes,
      ...entry.children.flatMap((child) => child.notes),
    ];
    const text = normalizeExclusionText(
      [
        entry.id,
        entry.title.es,
        entry.title.en,
        entry.text,
        ...entry.bullets,
        ...entry.children.flatMap((child) => [child.id, child.text]),
        ...exclusionNotes
          .filter((note) => noteIds.includes(note.id))
          .map((note) => note.text),
      ].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
}

export function exclusionScopeMatches(query: string): boolean {
  const terms = exclusionSearchTerms(query);
  const text = normalizeExclusionText(
    [
      exclusionSource.introduction,
      ...exclusionNotes
        .filter((note) => exclusionSource.notes.includes(note.id))
        .map((note) => note.text),
    ].join(" "),
  );
  return terms.length > 0 && terms.every((term) => text.includes(term));
}

// Text offsets are retained so accents/case can be ignored without rewriting the source.
export function exclusionHighlightParts(value: string, query: string) {
  const terms = exclusionSearchTerms(query);
  if (!terms.length) return [{ text: value, match: false }];
  const normalized = normalizeExclusionText(value);
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = 0;
    while (from < normalized.length) {
      const start = normalized.indexOf(term, from);
      if (start < 0) break;
      ranges.push([start, start + term.length]);
      from = start + term.length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const parts: { text: string; match: boolean }[] = [];
  let position = 0;
  for (const [start, end] of merged) {
    if (start > position)
      parts.push({ text: value.slice(position, start), match: false });
    parts.push({ text: value.slice(start, end), match: true });
    position = end;
  }
  if (position < value.length)
    parts.push({ text: value.slice(position), match: false });
  return parts;
}

export function exclusionResultLabel(count: number, locale: Locale) {
  return locale === "es"
    ? `${count} de ${exclusionEntries.length} apartados`
    : `${count} of ${exclusionEntries.length} sections`;
}
