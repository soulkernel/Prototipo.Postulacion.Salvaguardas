// URLs use the same one-based numbering displayed in the wizard.
const sections = ["general", "description", "budget", "risks", "sgas", "review"];
export function applicationStepFromQuery(
  value: unknown,
  section?: unknown,
): number {
  if (typeof section === "string" && sections.includes(section))
    return sections.indexOf(section);
  // Old bookmarks used 3 for risks and 4 for review. Stable section keys make
  // newly numbered links unambiguous after inserting Budget.
  return typeof value === "string" && /^[1-6]$/.test(value)
    ? Number(value) <= 2
      ? Number(value) - 1
      : Number(value) === 3
        ? 3
        : 5
    : 0;
}

export function applicationStepUrl(href: string, step: number): string {
  const url = new URL(href);
  url.searchParams.set("step", String(step + 1));
  url.searchParams.set("section", sections[step] ?? "general");
  return url.pathname + url.search + url.hash;
}
