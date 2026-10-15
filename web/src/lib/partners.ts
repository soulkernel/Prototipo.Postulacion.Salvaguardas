type Partners = { partners: string; associated_organizations?: string[] };
export function partnerOrganizations(concept: Partners): string[] {
  return (
    concept.associated_organizations ??
    (concept.partners.trim() ? [concept.partners] : [])
  );
}
export function partnerText(names: string[]): string {
  return names.map((name, i) => `${i + 1}. ${name.trim()}`).join("\n");
}
export function partnerIssues(concept: Partners): string[] {
  return concept.associated_organizations?.some((name) => !name.trim())
    ? ["partners"]
    : [];
}
