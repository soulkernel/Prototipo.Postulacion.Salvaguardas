import { z } from "zod";

export const sgasKind = "sgas_experience";
export const sgasAnswerKeys = [
  "manual_reviewed",
  "exclusions_confirmed",
  "human_rights_involved",
  "international_standards",
  "environmental_assessments",
  "environmental_social_experts",
  "gender_experts",
  "internal_staff",
  "external_staff",
  "external_expertise",
] as const;
export const sgasExperienceSchema = z
  .object({
    version: z.literal("glf-sgas-v1"),
    manual_reviewed: z.boolean().nullable(),
    exclusions_confirmed: z.boolean().nullable(),
    human_rights_involved: z.boolean().nullable(),
    investigation_status: z.string().max(4000),
    international_standards: z.boolean().nullable(),
    standards_detail: z.string().max(2000),
    environmental_assessments: z.boolean().nullable(),
    assessments_detail: z.string().max(2000),
    environmental_social_experts: z.boolean().nullable(),
    gender_experts: z.boolean().nullable(),
    internal_staff: z.boolean().nullable(),
    external_staff: z.boolean().nullable(),
    external_expertise: z.boolean().nullable(),
  })
  .strict();
export type SgasExperience = z.infer<typeof sgasExperienceSchema>;
export type SgasAnswerKey = (typeof sgasAnswerKeys)[number];
export function emptySgasExperience(): SgasExperience {
  return {
    version: "glf-sgas-v1",
    manual_reviewed: null,
    exclusions_confirmed: null,
    human_rights_involved: null,
    investigation_status: "",
    international_standards: null,
    standards_detail: "",
    environmental_assessments: null,
    assessments_detail: "",
    environmental_social_experts: null,
    gender_experts: null,
    internal_staff: null,
    external_staff: null,
    external_expertise: null,
  };
}
export function sgasIssues(value: unknown, required = true): string[] {
  if (value === undefined && !required) return [];
  const result = sgasExperienceSchema.safeParse(value);
  if (!result.success) return ["sgas_experience"];
  const f = result.data;
  const issues = sgasAnswerKeys
    .filter(
      (k) =>
        (k !== "external_expertise" || f.external_staff === true) &&
        f[k] === null,
    )
    .map((k) => `sgas_${k}`);
  if (f.human_rights_involved && !f.investigation_status.trim())
    issues.push("sgas_investigation_status");
  return issues;
}
type SgasConcept = {
  sgas_experience?: SgasExperience;
  applicant_type?: string;
  applicant_name?: string;
  title?: string;
};
export function sgasSource(c: SgasConcept) {
  return {
    version: "glf-sgas-document-v1" as const,
    questionnaire: c.sgas_experience ?? null,
    applicant_type: c.applicant_type ?? "",
    applicant_name: c.applicant_name ?? "",
    project_title: c.title ?? "",
  };
}
export type SgasSource = ReturnType<typeof sgasSource>;
export type SgasDocument = {
  id: string;
  kind: string;
  file_name: string;
  created_at: string;
  generation_source?: unknown;
  generated_locale?: string | null;
};
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
export function currentSgasDocument(c: SgasConcept, documents: SgasDocument[]) {
  if (sgasIssues(c.sgas_experience).length) return undefined;
  const source = canonical(sgasSource(c));
  return documents.find(
    (d) => d.kind === sgasKind && canonical(d.generation_source) === source,
  );
}
export const sgasGroups = [
  ["Revisión documental", "Document review"],
  ["Antecedentes y capacidad", "Background and capacity"],
  ["Equipo para la implementación", "Implementation team"],
] as const;
export function sgasQuestions(individual: boolean, es: boolean) {
  const who = individual
    ? es
      ? "usted o su equipo"
      : "you or your team"
    : es
      ? "su organización"
      : "your organization";
  const have = individual
    ? "Do you or your team have"
    : "Does your organization have";
  return [
    {
      key: "manual_reviewed",
      group: 0,
      number: 1,
      text: es
        ? "¿Ha revisado el Manual del Sistema de Gestión Ambiental y Social (SGAS) del GLF, incluidos los procedimientos? ¿Podrá cumplir con él?"
        : "Have you reviewed GLF’s Environmental and Social Management System (ESMS) Manual, including its procedures? Will you be able to comply with it?",
    },
    {
      key: "exclusions_confirmed",
      group: 0,
      number: 2,
      text: es
        ? "¿Puede confirmar que ha revisado la Lista de Exclusión actualizada del GLF y que su proyecto propuesto no incluye ninguna de estas actividades excluidas?"
        : "Can you confirm that you have reviewed GLF’s updated Exclusion List and that your proposed project does not include any of these excluded activities?",
    },
    {
      key: "human_rights_involved",
      group: 1,
      number: 3,
      text: es
        ? individual
          ? "¿Ha estado usted o su equipo involucrado en alguna violación de los derechos humanos en los últimos cinco años?"
          : "¿Ha estado involucrada su organización en alguna violación de los derechos humanos en los últimos cinco años?"
        : individual
          ? "Have you or your team been involved in any human rights violations in the last five years?"
          : "Has your organization been involved in any human rights violations in the last five years?",
    },
    {
      key: "international_standards",
      group: 1,
      number: 4,
      text: es
        ? `¿Tiene ${who} experiencia en la aplicación de normas de salvaguardia internacionales?`
        : `${have} experience applying international safeguard standards?`,
      help: es
        ? "Por ejemplo, Normas Ambientales y Sociales del Banco Mundial."
        : "For example, the World Bank’s Environmental and Social Standards.",
    },
    {
      key: "environmental_assessments",
      group: 1,
      number: 5,
      text: es
        ? `¿Tiene ${who} experiencia en la realización de evaluaciones ambientales y sociales y el desarrollo de herramientas de salvaguardas ambientales y sociales?`
        : `${have} experience conducting environmental and social assessments and developing environmental and social safeguard tools?`,
      help: es
        ? "Por ejemplo: EIA, EIAS, mecanismos de queja, planes de participación de las partes interesadas, protocolos de consentimiento libre, previo e informado y marcos de procesos de restricción de acceso."
        : "For example: EIA, ESIA, grievance mechanisms, stakeholder engagement plans, free, prior and informed consent protocols, and access restriction process frameworks.",
    },
    {
      key: "environmental_social_experts",
      group: 1,
      number: 6,
      text: es
        ? `¿Tiene ${who} expertos en salvaguardias ambientales y sociales (A&S)?`
        : `${have} environmental and social (E&S) safeguard experts?`,
    },
    {
      key: "gender_experts",
      group: 1,
      number: 7,
      text: es
        ? `¿Tiene ${who} expertos en igualdad de género?`
        : `${have} gender equality experts?`,
    },
    {
      key: "internal_staff",
      group: 2,
      number: 8,
      text: es
        ? "¿Trabajará con personal interno para realizar evaluaciones A&S adicionales (si es necesario)?"
        : "Will you work with internal staff to conduct additional E&S assessments (if necessary)?",
    },
    {
      key: "external_staff",
      group: 2,
      number: null,
      text: es
        ? "¿Trabajará con personal externo para evaluaciones A&S o herramientas de salvaguardia?"
        : "Will you work with external staff on E&S assessments or safeguard tools?",
      help: es
        ? "Puede combinar personal interno y externo."
        : "You may combine internal and external staff.",
    },
    {
      key: "external_expertise",
      group: 2,
      number: 9,
      text: es
        ? "Si trabaja con personal externo, ¿ha identificado la experiencia adecuada para el desarrollo de herramientas de salvaguardia?"
        : "If working with external staff, have you identified appropriate expertise for developing safeguard tools?",
    },
  ] as {
    key: SgasAnswerKey;
    group: number;
    number: number | null;
    text: string;
    help?: string;
  }[];
}
export function sgasIssueMessage(issue: string, locale: "es" | "en") {
  const es = locale === "es";
  if (issue === "sgas_document")
    return es
      ? "Finalice y anexe el formulario Experiencia SGAS, o actualice su anexo si modificó las respuestas."
      : "Complete and attach the ESMS experience form, or update its attachment if answers have changed.";
  if (issue === "sgas_investigation_status")
    return es
      ? "Indique el estado de cualquier investigación."
      : "State the status of any investigation.";
  const q = sgasQuestions(false, es).find((q) => `sgas_${q.key}` === issue);
  return q
    ? (es ? "Responda: " : "Answer: ") + q.text
    : es
      ? "Complete el formulario Experiencia SGAS."
      : "Complete the ESMS experience form.";
}
export function sgasPresentation(source: SgasSource, locale: "es" | "en") {
  const es = locale === "es",
    f = source.questionnaire;
  if (!f) return [];
  const rows: { question: string; answer: string; detail?: string }[] = [];
  for (const q of sgasQuestions(source.applicant_type === "individual", es)) {
    const inactive =
      q.key === "external_expertise" && f.external_staff !== true;
    rows.push({
      question:
        (q.number ? `${q.number}. ` : "") +
        q.text +
        (q.help ? " " + q.help : ""),
      answer: inactive
        ? es
          ? "No aplica"
          : "Not applicable"
        : f[q.key] === null
          ? es
            ? "Sin responder"
            : "Unanswered"
          : f[q.key]
            ? es
              ? "Sí"
              : "Yes"
            : es
              ? "No"
              : "No",
      detail: inactive
        ? undefined
        : q.key === "human_rights_involved" && f.human_rights_involved
          ? f.investigation_status
          : q.key === "international_standards" && f.international_standards
            ? f.standards_detail
            : q.key === "environmental_assessments" &&
                f.environmental_assessments
              ? f.assessments_detail
              : undefined,
    });
  }
  return rows;
}
