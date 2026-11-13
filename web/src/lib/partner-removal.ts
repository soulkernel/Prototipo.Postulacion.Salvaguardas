import type { SupabaseClient } from "@supabase/supabase-js";
import type { Payload } from "./domain";

export type PartnerRemovalResult =
  | { ok: true; revision: number; payload: Payload }
  | { ok: false; error: string; pending: boolean };

/** The DB freezes this partner's exact file set until Storage deletion finishes. */
export async function removePartnerAndFiles(
  db: SupabaseClient,
  appId: string,
  revision: number,
  partnerId: string,
): Promise<PartnerRemovalResult> {
  const args = {
    app_id: appId,
    expected_revision: revision,
    partner_id: partnerId,
  };
  try {
    const { data: job, error } = await db.rpc("begin_remove_partner", args);
    if (error)
      return {
        ok: false,
        error: error.message.match(/GLF_[A-Z_]+/)?.[0] || "GLF_SAVE_FAILED",
        pending: false,
      };
    if (!job.done) {
      if (!Array.isArray(job.paths))
        return { ok: false, error: "GLF_DELETE_FILES_PENDING", pending: true };
      for (let i = 0; i < job.paths.length; i += 100) {
        const { error: storageError } = await db.storage
          .from("application-files")
          .remove(job.paths.slice(i, i + 100));
        if (storageError)
          return {
            ok: false,
            error: "GLF_DELETE_FILES_PENDING",
            pending: true,
          };
      }
      const { data: finished, error: finishError } = await db.rpc(
        "finish_remove_partner",
        args,
      );
      if (finishError)
        return {
          ok: false,
          error:
            finishError.message.match(/GLF_[A-Z_]+/)?.[0] ||
            "GLF_DELETE_FILES_PENDING",
          pending: true,
        };
      return {
        ok: true,
        revision: finished.revision,
        payload: finished.payload,
      };
    }
    return { ok: true, revision: job.revision, payload: job.payload };
  } catch {
    // The response may have been lost after confirmation; retry is idempotent.
    return { ok: false, error: "GLF_DELETE_FILES_PENDING", pending: true };
  }
}
