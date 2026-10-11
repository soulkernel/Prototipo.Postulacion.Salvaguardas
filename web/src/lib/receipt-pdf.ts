import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { receiptDate, receiptNumber, type ReceiptAttachment } from "./receipt";
import type { Locale } from "./domain";

export async function receiptPdf(input: {
  id: string;
  reference: string;
  title: string;
  responsible: string;
  actorId: string;
  category: string;
  stage: number;
  revision: number;
  receivedAt: string;
  attachments: ReceiptAttachment[];
  baseUrl: string;
  locale: Locale;
}) {
  const es = input.locale === "es";
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const folder = path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans/files",
  );
  const font = await pdf.embedFont(
    await readFile(path.join(folder, "noto-sans-latin-400-normal.woff")),
    { subset: true },
  );
  const bold = await pdf.embedFont(
    await readFile(path.join(folder, "noto-sans-latin-700-normal.woff")),
    { subset: true },
  );
  const logo = await pdf.embedPng(
    await readFile(path.join(process.cwd(), "public/glf-logo.png")),
  );
  const navy = rgb(30 / 255, 58 / 255, 108 / 255);
  const black = rgb(0, 0, 0);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 740;
  const header = () => {
    page.drawRectangle({
      x: 0,
      y: 768,
      width: 595.28,
      height: 74,
      color: navy,
    });
    page.drawImage(logo, { x: 52, y: 779, width: 128, height: 53 });
    page.drawText("GALÁPAGOS LIFE FUND", {
      x: 300,
      y: 809,
      size: 10,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page.drawText(es ? "Comprobante de recepción" : "Submission receipt", {
      x: 300,
      y: 790,
      size: 11,
      font,
      color: rgb(1, 1, 1),
    });
  };
  header();
  function text(value: string, strong = false, size = 10, width = 491, x = 52) {
    const selected = strong ? bold : font;
    let line = "";
    const flush = () => {
      if (y < 65) {
        page = pdf.addPage([595.28, 841.89]);
        header();
        y = 740;
      }
      page.drawText(line, { x, y, size, font: selected, color: black });
      y -= size + 5;
      line = "";
    };
    for (const word of value.split(/\s+/).filter(Boolean)) {
      const candidate = line ? line + " " + word : word;
      if (line && selected.widthOfTextAtSize(candidate, size) > width) flush();
      if (line) line += " ";
      for (const char of word) {
        if (selected.widthOfTextAtSize(line + char, size) > width) flush();
        line += char;
      }
    }
    if (line) flush();
  }
  text(
    es ? "POSTULACIÓN RECIBIDA POR EL GLF" : "APPLICATION RECEIVED BY GLF",
    true,
    12,
  );
  y -= 5;
  text(receiptNumber(input.id), true, 9);
  y -= 10;
  const fields = [
    [es ? "Código del expediente" : "Application reference", input.reference],
    [es ? "Proyecto" : "Project", input.title],
    [es ? "Responsable del proyecto" : "Project lead", input.responsible],
    [es ? "Categoría de subvención" : "Grant category", input.category],
    [
      es ? "Fase y versión recibida" : "Phase and received version",
      `${input.stage} · v${input.revision}`,
    ],
    [
      es ? "Fecha y hora de recepción" : "Received on",
      receiptDate(input.receivedAt, input.locale) +
        (es ? " (hora Galápagos, UTC−06:00)" : " (Galapagos time, UTC−06:00)"),
    ],
    [
      es
        ? "Identificador de la cuenta remitente"
        : "Submitting account identifier",
      input.actorId,
    ],
  ];
  for (const [label, value] of fields) {
    text(label, true);
    text(value || "—");
    y -= 5;
  }
  y -= 5;
  text(es ? "DOCUMENTOS RECIBIDOS" : "RECEIVED DOCUMENTS", true, 12);
  const labels = es
    ? ["Nota conceptual firmada", "Evaluación de riesgos A&S firmada"]
    : ["Signed concept note", "Signed E&S risk assessment"];
  if (input.stage === 2)
    labels[0] = es ? "Propuesta completa firmada" : "Signed full proposal";
  for (const [index, kind] of ["concept_signed", "matrix_signed"].entries()) {
    const doc = input.attachments.find((d) => d.kind === kind);
    text(labels[index], true);
    text(
      doc?.file_name ||
        (es
          ? "Sin archivo registrado en este envío"
          : "No file recorded in this submission"),
      false,
      9,
    );
  }
  if (y < 260) {
    page = pdf.addPage([595.28, 841.89]);
    header();
    y = 740;
  }
  y -= 8;
  const qrY = y - 100;
  for (const [index, kind] of ["concept_signed", "matrix_signed"].entries()) {
    const doc = input.attachments.find((d) => d.kind === kind);
    if (!doc) continue;
    const url = new URL("/files/" + doc.id, input.baseUrl).toString();
    const qr = await pdf.embedPng(
      await QRCode.toBuffer(url, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: "M",
      }),
    );
    const x = index === 0 ? 90 : 350;
    page.drawImage(qr, { x, y: qrY, width: 100, height: 100 });
    page.drawText(
      es
        ? index === 0
          ? input.stage === 2
            ? "Propuesta completa"
            : "Nota conceptual"
          : "Evaluación A&S"
        : index === 0
          ? input.stage === 2
            ? "Full proposal"
            : "Concept note"
          : "E&S assessment",
      { x: x - 8, y: qrY - 15, size: 9, font: bold, color: black },
    );
  }
  y = qrY - 37;
  text(
    es
      ? "Los QR permiten descargar los archivos recibidos. Requieren iniciar sesión con una cuenta autorizada."
      : "The QR codes download the received files. Sign in with an authorized account.",
    false,
    9,
  );
  y -= 6;
  text(
    es
      ? "Este comprobante acredita la recepción de la postulación por el GLF. No constituye aprobación, selección ni validación de las firmas electrónicas o del contenido presentado."
      : "This receipt confirms that GLF received the application. It does not constitute approval, selection or validation of electronic signatures or submitted content.",
    false,
    9,
  );
  pdf.setTitle(receiptNumber(input.id));
  pdf.setAuthor("Galápagos Life Fund");
  pdf.setCreationDate(new Date(input.receivedAt));
  pdf.setModificationDate(new Date(input.receivedAt));
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(`${input.reference} · ${i + 1} / ${pages.length}`, {
      x: 52,
      y: 32,
      size: 8,
      font,
      color: black,
    }),
  );
  return pdf.save();
}
