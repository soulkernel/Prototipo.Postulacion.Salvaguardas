import { z } from "zod";
import { partnerRecords, type Partners } from "./partners";

export const attachmentFormats = ["pdf", "jpg", "png", "docx", "xlsx"] as const;
export const attachmentConditions = [
  "electronic_signature",
  "notarized",
  "other",
] as const;
export const attachmentRequirementSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[^\u0000-\u001f\u007f]+$/)
      .refine((id) => !["agreement", "sgas_experience"].includes(id)),
    label_es: z.string().trim().min(1).max(200),
    label_en: z.string().trim().min(1).max(200),
    formats: z.array(z.enum(attachmentFormats)).min(1).max(5),
    conditions: z.array(z.enum(attachmentConditions)).max(3),
    instructions_es: z.string().trim().max(2000),
    instructions_en: z.string().trim().max(2000),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (
      new Set(r.formats).size !== r.formats.length ||
      new Set(r.conditions).size !== r.conditions.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate values" });
    if (
      (r.conditions.includes("electronic_signature") ||
        ["concept_signed", "matrix_signed"].includes(r.id)) &&
      (r.formats.length !== 1 || r.formats[0] !== "pdf")
    )
      ctx.addIssue({
        code: "custom",
        message: "Electronic signatures require PDF",
      });
    if (
      ["concept_signed", "matrix_signed"].includes(r.id) &&
      !r.conditions.includes("electronic_signature")
    )
      ctx.addIssue({
        code: "custom",
        message: "Signed documents require a signature",
      });
    if (Boolean(r.instructions_es) !== Boolean(r.instructions_en))
      ctx.addIssue({
        code: "custom",
        message: "Instructions require both languages",
      });
    if (
      r.conditions.includes("other") &&
      (!r.instructions_es || !r.instructions_en)
    )
      ctx.addIssue({
        code: "custom",
        message: "Describe other conditions in both languages",
      });
  });
export const attachmentRequirementsSchema = z
  .array(attachmentRequirementSchema)
  .max(30)
  .superRefine((rows, ctx) => {
    for (const key of ["id", "label_es", "label_en"] as const) {
      const values = rows.map((r) =>
        r[key]
          .normalize("NFD")
          .replace(/\p{M}/gu, "")
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase(),
      );
      if (new Set(values).size !== rows.length)
        ctx.addIssue({ code: "custom", message: "Duplicate attachment" });
    }
  });
export type AttachmentRequirement = z.infer<typeof attachmentRequirementSchema>;
export const attachmentDraftSchema = z
  .array(
    z.object({
      ...attachmentRequirementSchema.shape,
      label_es: z.string().max(200),
      label_en: z.string().max(200),
      formats: z.array(z.enum(attachmentFormats)).max(5),
    }),
  )
  .max(30);
export type AttachmentRules = {
  required_attachments: string[];
  attachment_requirements?: AttachmentRequirement[];
};

export function requiredAttachments(
  rules: AttachmentRules,
): AttachmentRequirement[] {
  return rules.required_attachments.map(
    (id) =>
      rules.attachment_requirements?.find((r) => r.id === id) ?? {
        id,
        label_es: attachmentLabel(rules, id, "es"),
        label_en: attachmentLabel(rules, id, "en"),
        formats: ["concept_signed", "matrix_signed"].includes(id)
          ? ["pdf"]
          : [...attachmentFormats],
        conditions: ["concept_signed", "matrix_signed"].includes(id)
          ? ["electronic_signature"]
          : [],
        instructions_es: "",
        instructions_en: "",
      },
  );
}

export const partnerLetterPrefix = "partner_letter_";
export function partnerLetterKind(id: string) {
  return partnerLetterPrefix + id.replaceAll("-", "").toLowerCase();
}
export function isPartnerLetterRequirement(r: AttachmentRequirement) {
  return (
    ["partner_letter", "partner_letters", "partner_support_letters"].includes(
      r.id,
    ) ||
    /^(cartas? de apoyo de (las )?organizaciones asociadas|letters? of support from partner organizations)\.?$/i.test(
      r.label_es.trim(),
    ) ||
    /^(letters? of support from partner organizations)\.?$/i.test(
      r.label_en.trim(),
    )
  );
}
export function partnerLetterRequirements(
  concept: Partners,
  rules: AttachmentRules,
): AttachmentRequirement[] {
  const template = requiredAttachments(rules).find(isPartnerLetterRequirement);
  return partnerRecords(concept)
    .filter((p) => p.name.trim() && p.id)
    .map((p) => ({
      id: partnerLetterKind(p.id),
      label_es: `Carta de apoyo de ${p.name.trim()}`,
      label_en: `Letter of support from ${p.name.trim()}`,
      formats: template?.formats ?? [...attachmentFormats],
      conditions: template?.conditions ?? [],
      instructions_es: template?.instructions_es ?? "",
      instructions_en: template?.instructions_en ?? "",
    }));
}
/** Call requirements plus individual letters, without a duplicate generic letter. */
export function applicationAttachments(
  rules: AttachmentRules,
  concept: Partners,
  stage = 1,
) {
  const requirements = [
    ...requiredAttachments(rules).filter((r) => !isPartnerLetterRequirement(r)),
    ...partnerLetterRequirements(concept, rules),
  ];
  if (stage === 1 && !requirements.some(isExperienceRequirement)) requirements.unshift({
    id:"experience_capacity", label_es:"Anexo 1. Experiencia y capacidad del proponente y socios", label_en:"Annex 1. Applicant and partners’ experience and capacity", formats:["pdf","docx"],conditions:[],
    instructions_es:(concept as {applicant_type?:string}).applicant_type === "individual" ? "Adjunte su currículo y la experiencia de sus socios, si corresponde. El PDF Experiencia SGAS se incorpora por separado automáticamente." : "Adjunte un resumen de experiencia y una lista comentada de proyectos similares ejecutados; incluya la experiencia de los socios, si corresponde. El PDF Experiencia SGAS se incorpora por separado automáticamente.",
    instructions_en:(concept as {applicant_type?:string}).applicant_type === "individual" ? "Attach your CV and partner experience, where applicable. The ESMS experience PDF is attached separately and automatically." : "Attach an experience summary and an annotated list of similar completed projects, including partner experience where applicable. The ESMS experience PDF is attached separately and automatically.",
  });
  return requirements;
}
export function isExperienceRequirement(r:AttachmentRequirement) {
 if(/\b(sgas|esms)\b/i.test(r.label_es+" "+r.label_en))return false;
 return ["experience_capacity","experience","cv","curriculum","applicant_experience","organization_experience","reference_information"].includes(r.id) ||
   /experiencia y capacidad|resumen de (la )?experiencia|experience and capacity|applicant.*experience|curr[ií]cul/i.test(r.label_es+" "+r.label_en);
}
export function missingPartnerLetters(
  concept: Partners,
  rules: AttachmentRules,
  documents: { kind: string }[],
) {
  return partnerLetterRequirements(concept, rules).filter(
    (r) => !documents.some((d) => d.kind === r.id),
  );
}
export function isPartnerLetterDocument(rules: AttachmentRules, kind: string) {
  return (
    kind.startsWith(partnerLetterPrefix) ||
    requiredAttachments(rules).some(
      (r) => r.id === kind && isPartnerLetterRequirement(r),
    )
  );
}
export function partnerLetterError(
  code: string,
  concept: Partners,
  locale: "es" | "en",
) {
  const match = code.match(
    /GLF_PARTNER_LETTER_(REQUIRED|INVALID):([a-f0-9]{32})/,
  );
  if (!match) return null;
  const name = partnerRecords(concept).find(
    (p) => p.id.replaceAll("-", "").toLowerCase() === match[2],
  )?.name;
  if (!name) return null;
  return locale === "es"
    ? `${match[1] === "REQUIRED" ? "Falta cargar" : "No se pudo validar"} la carta de apoyo de ${name}. Revísela en Revisar y enviar → Anexos.`
    : `${match[1] === "REQUIRED" ? "Upload" : "Could not validate"} the letter of support from ${name}. Check Review and submit → Attachments.`;
}
export function attachmentLabel(
  rules: AttachmentRules,
  id: string,
  locale: "es" | "en",
) {
  const r = rules.attachment_requirements?.find((r) => r.id === id);
  const builtIn: Record<string, [string, string]> = {
    sgas_experience: ["Experiencia SGAS", "ESMS experience"],
    concept_signed: [
      "Nota conceptual firmada electrónicamente",
      "Electronically signed concept note",
    ],
    matrix_signed: [
      "Evaluación ambiental y social firmada electrónicamente",
      "Electronically signed environmental and social assessment",
    ],
    other: ["Otro anexo", "Other attachment"],
    agreement: ["Convenio", "Agreement"],
  };
  return (
    r?.[locale === "es" ? "label_es" : "label_en"] ??
    builtIn[id]?.[locale === "es" ? 0 : 1] ??
    id
  );
}
export function attachmentAccept(r: AttachmentRequirement) {
  return r.formats
    .flatMap((f) => (f === "jpg" ? [".jpg", ".jpeg"] : [`.${f}`]))
    .join(",");
}
export function attachmentFormatAllowed(
  r: AttachmentRequirement,
  extension: string,
) {
  return r.formats.includes(
    (extension === "jpeg" ? "jpg" : extension) as (typeof r.formats)[number],
  );
}
export const conditionLabel = (condition: string, es: boolean) =>
  ({
    electronic_signature: es ? "Firma electrónica" : "Electronic signature",
    notarized: es ? "Documento notarizado" : "Notarized document",
    other: es
      ? "Otra condición: consulte las instrucciones"
      : "Other condition: see instructions",
  })[condition] ?? condition;
