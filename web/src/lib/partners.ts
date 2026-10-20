export type PartnerOrganization = {
  id: string;
  name: string;
  support?: string;
};
export type Partners = {
  partners: string;
  associated_organizations?: string[];
  partner_organizations?: PartnerOrganization[];
};
export function partnerRecords(concept: Partners): PartnerOrganization[] {
  return (
    concept.partner_organizations ??
    partnerOrganizations(concept).map((name) => ({ id: "", name }))
  );
}
export function initializePartners(concept: Partners): PartnerOrganization[] {
  return partnerRecords(concept).map((p) => ({
    ...p,
    id: p.id || crypto.randomUUID(),
  }));
}
export function partnerPatch(rows: PartnerOrganization[]) {
  const names = rows.map((p) => p.name);
  return {
    partner_organizations: rows,
    associated_organizations: names,
    partners: partnerText(names),
  };
}
export function partnerOrganizations(concept: Partners): string[] {
  if (concept.partner_organizations)
    return concept.partner_organizations.map((p) => p.name);
  return (
    concept.associated_organizations ??
    (concept.partners.trim() ? [concept.partners] : [])
  );
}
export function partnerText(names: string[]): string {
  return names.map((name, i) => `${i + 1}. ${name.trim()}`).join("\n");
}
export function partnerIssues(concept: Partners): string[] {
  return partnerRecords(concept).some(
    (p) => !p.name.trim() || !p.support?.trim(),
  )
    ? ["partners"]
    : [];
}
