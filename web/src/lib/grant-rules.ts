export const grantRuleVersion = "glf-2025-v1";
const themeRows = [
  [
    "education",
    "Iniciativas de Educación y vinculación comunitaria",
    "Education and community outreach",
  ],
  ["research", "Investigación", "Research"],
  ["fisheries", "Pesca Sostenible", "Sustainable Fisheries"],
  ["tourism", "Turismo Sostenible", "Sustainable Tourism"],
] as const;
export const callThemes = themeRows.map(([id, label_es, label_en]) => ({
  id,
  label_es,
  label_en,
}));
export const submissionNotice = {
  es: "El contenido corresponde a una postulación al GLF y está sujeto a validación. Su presentación no garantiza preselección, aprobación ni financiamiento.",
  en: "This document contains an application to GLF and is subject to validation. Submission does not guarantee shortlisting, approval or funding.",
};
export const grantRanges = {
  small: { min: 0, max: 100000, es: "Pequeña subvención", en: "Small grant" },
  medium: {
    min: 100000.01,
    max: 250000,
    es: "Mediana subvención",
    en: "Medium grant",
  },
  large: {
    min: 250000.01,
    max: null,
    es: "Gran subvención",
    en: "Large grant",
  },
};
