import { z } from "zod";

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
      .refine((id) => id !== "agreement"),
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
export function attachmentLabel(
  rules: AttachmentRules,
  id: string,
  locale: "es" | "en",
) {
  const r = rules.attachment_requirements?.find((r) => r.id === id);
  const builtIn: Record<string, [string, string]> = {
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
