// Legacy snapshots retain their recorded layout; defaults apply only to new documents.
export const currentConceptLayout = "glf-concept-20261020-v5";
export const monitoringConceptLayout = "glf-concept-20261020-v4";
export const resultsConceptLayout = "glf-concept-20261020-v3";
export const previousGlfConceptLayout = "glf-concept-20261020-v2";
export const previousConceptLayout = "glf-concept-m08-v1";
export type ConceptPresentation = {
  stage: number;
  layoutVersion?: string | null;
};
export function usesCurrentGlfForm(presentation: ConceptPresentation) {
  return (
    presentation.layoutVersion === currentConceptLayout ||
    presentation.layoutVersion === monitoringConceptLayout ||
    presentation.layoutVersion === resultsConceptLayout ||
    presentation.layoutVersion === previousGlfConceptLayout
  );
}
export function includesDetailedResults(presentation: ConceptPresentation) {
  return presentation.stage === 2 || !usesStageSpecificResults(presentation);
}
export function usesStageSpecificResults(presentation: ConceptPresentation) {
  return (
    presentation.layoutVersion === currentConceptLayout ||
    presentation.layoutVersion === monitoringConceptLayout ||
    presentation.layoutVersion === resultsConceptLayout
  );
}
export function usesStructuredMonitoring(presentation: ConceptPresentation) {
  return (
    presentation.layoutVersion === currentConceptLayout ||
    presentation.layoutVersion === monitoringConceptLayout
  );
}
export function usesStructuredSustainability(
  presentation: ConceptPresentation,
) {
  return presentation.layoutVersion === currentConceptLayout;
}
export function groupsProjectDates(presentation: ConceptPresentation) {
  return (
    usesCurrentGlfForm(presentation) ||
    presentation.layoutVersion === previousConceptLayout
  );
}
export function includesAdministrativeCost(presentation: ConceptPresentation) {
  return presentation.stage === 2 || !groupsProjectDates(presentation);
}
