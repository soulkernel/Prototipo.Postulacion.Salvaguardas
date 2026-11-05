import type { Role } from "./domain";
// Documentation access does not grant access to any operational screen.
export const internalManualRoles = [
  "internal_member",
  "grants_manager",
  "sustainability_reviewer",
  "project_coordinator",
  "committee_member",
  "administrator",
] as const satisfies readonly Role[];
export function canReadInternalManual(profile: {
  role: Role;
  access_kind?: string;
}) {
  return (
    profile.access_kind === "academic" ||
    (internalManualRoles as readonly Role[]).includes(profile.role)
  );
}
