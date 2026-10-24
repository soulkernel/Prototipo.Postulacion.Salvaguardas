import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFArray,
  PDFNumber,
  PDFHexString,
  PDFString,
} from "pdf-lib";

/** Structural detection only. Does not authenticate the signer, certificate or CMS digest. */
export async function detectPdfSignature(
  bytes: Uint8Array,
): Promise<"detected" | "missing" | "unreadable"> {
  try {
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    for (const [, object] of pdf.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFDict)) continue;
      const candidate =
        object.get(PDFName.of("FT"))?.toString() === "/Sig"
          ? object.lookup(PDFName.of("V"))
          : object;
      if (!(candidate instanceof PDFDict)) continue;
      if (
        candidate.get(PDFName.of("Type"))?.toString() !== "/Sig" &&
        object.get(PDFName.of("FT"))?.toString() !== "/Sig"
      )
        continue;
      const range = candidate.lookup(PDFName.of("ByteRange"));
      const contents = candidate.lookup(PDFName.of("Contents"));
      if (!(range instanceof PDFArray) || range.size() !== 4) continue;
      if (!(contents instanceof PDFHexString || contents instanceof PDFString))
        continue;
      const values = range
        .asArray()
        .map((x) => (x instanceof PDFNumber ? x.asNumber() : NaN));
      const [start, firstLength, secondStart, secondLength] = values;
      if (
        !values.every((x) => Number.isSafeInteger(x) && x >= 0) ||
        start !== 0 ||
        firstLength === 0 ||
        secondStart <= firstLength ||
        secondLength === 0 ||
        secondStart + secondLength > bytes.length
      )
        continue;
      const signature = contents.asBytes();
      // CMS signatures contain ASN.1 DER sequences; reject empty placeholders.
      if (
        signature.length > 16 &&
        signature[0] === 0x30 &&
        signature.some((x) => x !== 0)
      )
        return "detected";
    }
    return "missing";
  } catch {
    return "unreadable";
  }
}
