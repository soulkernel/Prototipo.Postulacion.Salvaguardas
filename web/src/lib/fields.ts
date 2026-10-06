import type { Concept, Locale } from "./domain";
type Field = {
  key: keyof Concept;
  es: string;
  en: string;
  type?: "email" | "tel" | "date" | "number" | "textarea";
};
export const identityFields: Field[] = [
  { key: "title", es: "Título del proyecto", en: "Project title" },
  {
    key: "applicant_name",
    es: "Nombre de organización o proponente",
    en: "Organization or applicant name",
  },
  { key: "contact_name", es: "Persona de contacto", en: "Contact person" },
  {
    key: "email",
    es: "Correo electrónico de contacto",
    en: "Contact email",
    type: "email",
  },
  {
    key: "phone",
    es: "Teléfono de contacto",
    en: "Contact phone",
    type: "tel",
  },
  { key: "address", es: "Dirección del proponente", en: "Applicant address" },
  {
    key: "partners",
    es: "Organizaciones asociadas (si aplica)",
    en: "Partner organizations (if applicable)",
  },
  {
    key: "location",
    es: "Ubicación y ámbito del proyecto",
    en: "Project location and scope",
  },
  { key: "project_type", es: "Tipo de proyecto", en: "Project type" },
  {
    key: "start_date",
    es: "Fecha de inicio propuesta",
    en: "Proposed start date",
    type: "date",
  },
  {
    key: "end_date",
    es: "Fecha de finalización propuesta",
    en: "Proposed end date",
    type: "date",
  },
  {
    key: "requested_amount",
    es: "Monto solicitado al GLF (USD)",
    en: "Amount requested from GLF (USD)",
    type: "number",
  },
  {
    key: "cofinance_amount",
    es: "Cofinanciamiento (USD)",
    en: "Cofinancing (USD)",
    type: "number",
  },
  {
    key: "admin_cost",
    es: "Gastos administrativos (USD)",
    en: "Administrative expenses (USD)",
    type: "number",
  },
];
export const narrativeFields: Field[] = [
  {
    key: "summary",
    es: "Resumen: contexto, problema, amenazas, justificación, solución y resultados",
    en: "Summary: context, problem, threats, rationale, solution and results",
    type: "textarea",
  },
  {
    key: "objectives",
    es: "Objetivo general y objetivos específicos",
    en: "General and specific objectives",
    type: "textarea",
  },
  {
    key: "beneficiaries",
    es: "Beneficiarios y contribuciones a los medios de vida",
    en: "Beneficiaries and contributions to livelihoods",
    type: "textarea",
  },
  {
    key: "results",
    es: "Resultados e indicadores esperados",
    en: "Expected results and indicators",
    type: "textarea",
  },
  {
    key: "sustainability",
    es: "Sostenibilidad y replicabilidad",
    en: "Sustainability and replicability",
    type: "textarea",
  },
  {
    key: "alignment",
    es: "Alineación estratégica: GLF, ODS y Plan Galápagos 2030",
    en: "Strategic alignment: GLF, SDGs and Galápagos 2030 Plan",
    type: "textarea",
  },
  {
    key: "monitoring",
    es: "Seguimiento y evaluación propuestos",
    en: "Proposed monitoring and evaluation",
    type: "textarea",
  },
  {
    key: "environmental_risks",
    es: "Riesgos ambientales potenciales",
    en: "Potential environmental risks",
    type: "textarea",
  },
  {
    key: "social_risks",
    es: "Riesgos sociales potenciales",
    en: "Potential social risks",
    type: "textarea",
  },
];
export const statusLabels: Record<string, [string, string]> = {
  draft: ["Borrador", "Draft"],
  submitted: ["Recibida", "Received"],
  under_review: ["En revisión", "Under review"],
  selected_for_phase2: ["Invitada a Fase 2", "Invited to Phase 2"],
  not_selected: ["No seleccionada", "Not selected"],
  phase2_draft: ["Proyecto completo en borrador", "Full proposal draft"],
  phase2_submitted: ["Proyecto completo recibido", "Full proposal received"],
  approved: ["Aprobada", "Approved"],
  contract_pending: ["Convenio pendiente", "Agreement pending"],
  contract_signed: ["Convenio firmado", "Agreement signed"],
  closed: ["Cerrada", "Closed"],
};
export function statusLabel(status: string, locale: Locale) {
  return statusLabels[status]?.[locale === "es" ? 0 : 1] || status;
}
export const roleLabels: Record<string, [string, string]> = {
  applicant: ["Aplicante", "Applicant"],
  grants_manager: ["Convocatorias y subvenciones", "Calls and grants"],
  sustainability_reviewer: [
    "Sostenibilidad y salvaguardas",
    "Sustainability and safeguards",
  ],
  project_coordinator: ["Coordinación de proyectos", "Project coordination"],
  committee_member: ["Comité / consejo", "Committee / council"],
  administrator: ["Administración del sistema", "System administration"],
};
