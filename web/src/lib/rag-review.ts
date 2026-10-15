import { z } from "zod";
import { qwenResponse } from "./qwen-contract";
import { evidenceSourceName, evidenceLocation } from "./evidence-presentation";
import type { RagRisk } from "./rag-context";
const selection = {
  selected_ids: z.array(z.string().min(1).max(250)).min(1).max(6).optional(),
  draft_kind: z.literal("applicant_observation").optional(),
};
export const e5ReviewEvidence = z.object({
  results: z
    .array(
      z.object({
        id: z.number().int().positive(),
        document_name: z.string().max(1000),
        document_version: z.string().max(1000),
        locator: z.string().max(1000),
        content: z.string().max(20000),
        similarity: z.number().finite(),
      }),
    )
    .max(6),
  ...selection,
});
export const qwenReviewEvidence = qwenResponse.and(z.object(selection));
export function parseReviewEvidence(method: string, value: unknown) {
  const parsed =
    method === "e5"
      ? e5ReviewEvidence.safeParse(value)
      : qwenReviewEvidence.safeParse(value);
  if (!parsed.success) return null;
  const data = parsed.data;
  const ids = new Set(
    data.results.map((row) => ("id" in row ? String(row.id) : row.chunk_id)),
  );
  if (
    data.selected_ids &&
    (new Set(data.selected_ids).size !== data.selected_ids.length ||
      data.selected_ids.some((id) => !ids.has(id)))
  )
    return null;
  if (data.draft_kind && !data.selected_ids?.length) return null;
  return data;
}
export type ReviewReference = {
  id: string;
  name: string;
  locator: string;
  text: string;
};
export function selectedReferences(
  method: string,
  evidence: unknown,
  ids: string[],
  es: boolean,
): ReviewReference[] {
  const parsed = parseReviewEvidence(method, evidence);
  if (!parsed || !ids.length || new Set(ids).size !== ids.length) return [];
  const rows = parsed.results.map((row) =>
    "id" in row
      ? {
          id: String(row.id),
          name: evidenceSourceName(row.document_name),
          locator: evidenceLocation(row.locator, es),
          text: row.content,
        }
      : {
          id: row.chunk_id,
          name: row.source_name,
          locator: `${es ? "Página" : "Page"} ${row.page} · ${row.chunk_id}`,
          text: row.text,
        },
  );
  if (ids.some((id) => !rows.some((row) => row.id === id))) return [];
  return rows.filter((row) => ids.includes(row.id));
}
export function prepareApplicantObservation(
  risk: RagRisk,
  stage: number,
  references: ReviewReference[],
  instruction: string,
  es: boolean,
) {
  if (!references.length || references.length > 6) throw new Error("selection");
  const topic = risk.name.trim().slice(0, 350);
  const activity = risk.activity.trim().slice(0, 350);
  const request =
    instruction.trim().slice(0, 1000) ||
    (es
      ? stage === 1
        ? "Precise el alcance del riesgo, las personas o componentes ambientales expuestos y los elementos utilizados para sustentar la probabilidad y la gravedad consignadas. Adjunte o identifique la información que permita verificar su explicación."
        : "Precise las medidas propuestas para este riesgo, sus responsables, plazos, recursos y la forma de verificar su implementación y efectividad en el PGAS."
      : stage === 1
        ? "Clarify the risk scope, affected people or environmental components, and the basis for the stated likelihood and severity. Identify the information supporting your explanation."
        : "Clarify the proposed measures, responsibilities, schedule, resources and verification of implementation and effectiveness in the ESMP.");
  const refs = references
    .map(
      (ref, i) =>
        `[${i + 1}] ${ref.name.slice(0, 150)} · ${ref.locator.slice(0, 220)}`,
    )
    .join("\n");
  return es
    ? `En relación con la actividad «${activity}» y el riesgo «${topic}», solicitamos ampliar la información presentada para continuar su revisión técnica.\n\n${request}\n\nComo apoyo para preparar su aclaración, considere las siguientes referencias seleccionadas para este riesgo. Revise su alcance y explique cuáles resultan aplicables a su propuesta:\n${refs}\n\nLa presente observación solicita información adicional; no constituye una decisión de selección o aprobación del proyecto.`
    : `Regarding the activity “${activity}” and risk “${topic}”, please clarify the information submitted to support the technical review.\n\n${request}\n\nConsider the following references selected for this risk when preparing your clarification. Check their scope and explain which apply to your proposal:\n${refs}\n\nThis observation requests additional information; it is not a project selection or approval decision.`;
}
