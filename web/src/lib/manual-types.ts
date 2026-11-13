export type ManualText = [string, string];
export type ManualChapter = {
  id: string;
  title: ManualText;
  intro: ManualText;
  steps: ManualText[];
  rows: [string, string, string, string][];
  tip: ManualText;
  screen: ManualText[];
  audience?: ManualText;
  outcome?: ManualText;
};
export type ManualGuide = {
  title: ManualText;
  kicker: ManualText;
  headline: ManualText;
  lead: ManualText;
  audience: ManualText;
  updated: readonly [string, string];
  journey: ReadonlyArray<readonly [string, string, string]>;
  icons: Array<
    | "user"
    | "book"
    | "wallet"
    | "checks"
    | "file"
    | "send"
    | "folder"
    | "calendar"
    | "search"
    | "chart"
    | "archive"
    | "users"
  >;
  chapters: ManualChapter[];
  backLabel: ManualText;
  empty: ManualText;
};
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function searchManualChapters(
  chapters: ManualChapter[],
  query: string,
  language: 0 | 1,
) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return chapters.filter((c) => {
    const text = normalize(
      [
        c.title[language],
        c.intro[language],
        c.audience?.[language],
        c.outcome?.[language],
        ...c.steps.map((s) => s[language]),
        ...c.rows.flatMap((r) => [r[language * 2], r[language * 2 + 1]]),
        ...c.screen.map((s) => s[language]),
        c.tip[language],
      ].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
}
