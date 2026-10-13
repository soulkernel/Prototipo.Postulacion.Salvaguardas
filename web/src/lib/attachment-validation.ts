import { validateFile } from "./files";
import { detectPdfSignature } from "./pdf-signature";
import {
  attachmentFormatAllowed,
  type AttachmentRequirement,
} from "./attachment-requirements";

export async function validateRequiredFile(
  requirement: AttachmentRequirement,
  name: string,
  bytes: Uint8Array,
) {
  const file = validateFile(name, bytes);
  if (!file) return "GLF_ATTACHMENT_UNREADABLE";
  if (!attachmentFormatAllowed(requirement, file.extension))
    return "GLF_ATTACHMENT_FORMAT";
  if (requirement.conditions.includes("electronic_signature")) {
    if (file.extension !== "pdf") return "GLF_ATTACHMENT_FORMAT";
    const signature = await detectPdfSignature(bytes);
    if (signature !== "detected")
      return signature === "missing"
        ? "GLF_SIGNATURE_MISSING"
        : "GLF_SIGNATURE_UNREADABLE";
  }
  return null;
}

export async function validateRequiredDocuments(
  requirements: AttachmentRequirement[],
  documents: { kind: string; file_name: string; storage_path: string }[],
  load: (path: string) => Promise<Uint8Array>,
) {
  let index = 0;
  let failure: string | null = null;
  async function worker() {
    while (!failure && index < requirements.length) {
      const requirement = requirements[index++];
      // Callers order the files newest first; a replaced file must be rechecked.
      const document = documents.find((d) => d.kind === requirement.id);
      if (!document) {
        failure = "GLF_ATTACHMENT_REQUIRED";
        return;
      }
      try {
        const error = await validateRequiredFile(
          requirement,
          document.file_name,
          await load(document.storage_path),
        );
        if (error) failure = error;
      } catch {
        failure = "GLF_ATTACHMENT_UNREADABLE";
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(3, requirements.length) }, worker),
  );
  return failure;
}
