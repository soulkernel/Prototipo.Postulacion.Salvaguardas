// URLs use the same one-based numbering displayed in the wizard.
export function applicationStepFromQuery(value: unknown): number {
  return typeof value === "string" && /^[1-4]$/.test(value)
    ? Number(value) - 1
    : 0;
}

export function applicationStepUrl(href: string, step: number): string {
  const url = new URL(href);
  url.searchParams.set("step", String(step + 1));
  return url.pathname + url.search + url.hash;
}
