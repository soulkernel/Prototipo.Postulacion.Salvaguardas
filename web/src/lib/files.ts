const formats: Record<string, { mime: string; signature: number[] }> = {
  pdf: { mime: "application/pdf", signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  png: {
    mime: "image/png",
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  jpg: { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  jpeg: { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
};
export function validateFile(name: string, bytes: Uint8Array) {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  const format = formats[extension];
  if (
    !format ||
    bytes.length === 0 ||
    bytes.length > 25 * 1024 * 1024 ||
    name.length > 200 ||
    /[\u0000-\u001f\/\\]/.test(name) ||
    !format.signature.every((b, i) => bytes[i] === b)
  )
    return null;
  return { extension, mime: format.mime };
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
