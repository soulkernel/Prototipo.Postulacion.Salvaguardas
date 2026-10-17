import { riskLevel, type Concept, type Locale } from "./domain";

export function riskLevelLabel(score: number | null, locale: Locale) {
  const labels = {
    incomplete: ["Sin completar", "Incomplete"],
    low: ["Bajo", "Low"],
    medium: ["Medio", "Medium"],
    high: ["Alto", "High"],
    very_high: ["Muy alto", "Very high"],
  };
  return labels[riskLevel(score)][locale === "es" ? 0 : 1];
}
export function workflowLabel(
  group: "event" | "review" | "decision" | "body",
  value: string,
  locale: Locale,
) {
  const labels: Record<string, Record<string, [string, string]>> = {
    event: {
      created: ["Expediente creado", "Application created"],
      submitted: ["Postulación recibida", "Application received"],
      document_added: ["Anexo incorporado", "Attachment added"],
      correction_authorized: ["Corrección autorizada", "Correction authorized"],
      review_recorded: ["Revisión registrada", "Review recorded"],
      decision_recorded: ["Resolución registrada", "Decision recorded"],
      agreement_signed: [
        "Convenio firmado registrado",
        "Signed agreement recorded",
      ],
    },
    review: {
      safeguards: ["Revisión de salvaguardas", "Safeguards review"],
      grants: ["Revisión de subvenciones", "Grants review"],
      coordination: [
        "Revisión de coordinación de proyectos",
        "Project coordination review",
      ],
    },
    decision: {
      recommend: ["Recomendación técnica", "Technical recommendation"],
      invite: ["Invitación a fase 2", "Invitation to Phase 2"],
      not_select: ["No seleccionada", "Not selected"],
      approve: ["Proyecto aprobado", "Project approved"],
      reject: ["Proyecto no aprobado", "Project not approved"],
    },
    body: {
      CAT: [
        "Comité Asesor Técnico (CAT)",
        "Technical Advisory Committee (CAT)",
      ],
      committee: ["Comité", "Committee"],
      council: ["Consejo", "Council"],
    },
  };
  return labels[group][value]?.[locale === "es" ? 0 : 1] ?? value;
}
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
  { key: "province", es: "Provincia del proponente", en: "Applicant province" },
  {
    key: "city",
    es: "Ciudad o localidad del proponente",
    en: "Applicant city or locality",
  },
  {
    key: "address",
    es: "Dirección específica del proponente",
    en: "Applicant street address",
  },
  { key: "project_islands", es: "Islas de ejecución", en: "Project islands" },
  {
    key: "other_islands",
    es: "Otras islas de ejecución",
    en: "Other project islands",
  },
  {
    key: "partners",
    es: "Organizaciones asociadas (si aplica)",
    en: "Partner organizations (if applicable)",
  },
  {
    key: "location",
    es: "Ubicación específica y ámbito del proyecto",
    en: "Specific project location and scope",
  },
  { key: "project_type", es: "Tema de aplicación", en: "Application topic" },
  {
    key: "start_date",
    es: "Fecha de inicio del proyecto",
    en: "Project start date",
    type: "date",
  },
  {
    key: "end_date",
    es: "Fecha de finalización del proyecto",
    en: "Project end date",
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
export function identityFieldsForStage(stage: number) {
  return identityFields.filter(
    (field) => stage === 2 || field.key !== "admin_cost",
  );
}

export const narrativeFields: Field[] = [
  {
    key: "summary",
    es: "Resumen del proyecto",
    en: "Project summary",
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
    es: "Alineación estratégica: Plan Galápagos 2030 y ODS",
    en: "Strategic alignment: Galápagos 2030 Plan and SDGs",
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
const applicantStatusLabels: Record<string, [string, string]> = {
  submitted: ["Enviada al GLF", "Submitted to GLF"],
  under_review: ["En revisión por GLF", "Under review by GLF"],
  phase2_submitted: [
    "Propuesta completa enviada al GLF",
    "Full proposal submitted to GLF",
  ],
};
export function statusLabel(
  status: string,
  locale: Locale,
  audience: "internal" | "applicant" = "internal",
) {
  if (audience === "applicant" && applicantStatusLabels[status]) {
    return applicantStatusLabels[status][locale === "es" ? 0 : 1];
  }
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
