"use server";
import { z } from "zod";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { revalidatePath } from "next/cache";
export async function saveWorkingReview(input: unknown) {
  const es = (await getLocale()) === "es";
  const parsed = z
    .object({
      applicationId: z.uuid(),
      versionId: z.uuid(),
      kind: z.enum(["rubric", "administrative"]),
      revision: z.number().int().nonnegative(),
      answers: z.record(
        z.string().max(80),
        z.union([
          z.number().int().min(1).max(5),
          z.enum(["yes", "no", "pending", "not_applicable"]),
          z.null(),
        ]),
      ),
      notes: z.string().max(5000),
    })
    .safeParse(input);
  if (!parsed.success)
    return {
      error: es
        ? "Revise los valores de evaluación."
        : "Check evaluation values.",
    };
  const i = parsed.data;
  const { db } = await requireViewer(
    i.kind === "rubric"
      ? ["committee_member", "administrator"]
      : ["grants_manager", "project_coordinator", "administrator"],
  );
  const { data, error } = await db.rpc("save_working_review", {
    app_id: i.applicationId,
    submitted_version: i.versionId,
    review_kind: i.kind,
    expected_revision: i.revision,
    values_json: i.answers,
    observation: i.notes,
  });
  if (error)
    return {
      error: error.message.includes("CONFLICT")
        ? es
          ? "Otro cambio o una nueva versión fue registrado. Recargue antes de guardar."
          : "A concurrent change or new version was recorded. Reload before saving."
        : es
          ? "No se guardó: compruebe la etapa y los valores."
          : "Not saved: check the stage and values.",
    };
  revalidatePath(
    "/internal/applications/" + i.applicationId + "/working-review",
  );
  return { revision: Number(data.revision) };
}
