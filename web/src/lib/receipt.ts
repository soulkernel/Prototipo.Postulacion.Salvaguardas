import { z } from "zod";
import type { Locale } from "./domain";

export function receiptNumber(versionId: string) {
  return "GLF-REC-" + versionId.toUpperCase();
}

export function receiptDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-EC" : "en-GB", {
    timeZone: "Pacific/Galapagos",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

const attachmentSchema = z.object({
  id: z.uuid(),
  kind: z.string(),
  file_name: z.string(),
  sha256: z.string(),
});
export type ReceiptAttachment = z.infer<typeof attachmentSchema>;

// Resolve only IDs and checksums frozen in this submission; never use the
// application's current documents, which may belong to a later correction.
export function receiptAttachments(
  snapshot: unknown,
  stored: {
    id: string;
    sha256: string;
    created_at: string;
  }[],
): ReceiptAttachment[] {
  const parsed = z.array(attachmentSchema).safeParse(snapshot);
  if (!parsed.success) return [];
  const dates = new Map(stored.map((d) => [d.id, d]));
  return ["concept_signed", "matrix_signed"].flatMap((kind) => {
    const candidates = parsed.data.filter(
      (d) => d.kind === kind && dates.get(d.id)?.sha256 === d.sha256,
    );
    candidates.sort(
      (a, b) =>
        dates
          .get(b.id)!
          .created_at.localeCompare(dates.get(a.id)!.created_at) ||
        b.id.localeCompare(a.id),
    );
    return candidates.slice(0, 1);
  });
}
