// Null identifies documents prepared before M08. Keep their original content.
export const currentConceptLayout = "glf-concept-m08-v1";
export type ConceptPresentation = {
  stage: number;
  layoutVersion?: string | null;
};
export function includesAdministrativeCost({
  stage,
  layoutVersion,
}: ConceptPresentation) {
  return stage === 2 || layoutVersion !== currentConceptLayout;
}
