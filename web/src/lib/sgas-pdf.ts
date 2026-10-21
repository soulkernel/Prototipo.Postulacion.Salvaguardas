import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  sgasPresentation,
  sgasIssues,
  type SgasSource,
} from "./sgas-experience";

// Portable renderer, also bundled into the authenticated Supabase function.
export async function sgasPdf(input: {
  source: SgasSource;
  reference: string;
  revision: number;
  generatedAt: string;
  locale: "es" | "en";
  regular: Uint8Array;
  bold: Uint8Array;
  logo: Uint8Array;
}) {
  if (sgasIssues(input.source.questionnaire).length)
    throw Error("GLF_REQUIRED:sgas_experience");
  const es = input.locale === "es",
    pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(input.regular, { subset: true }),
    bold = await pdf.embedFont(input.bold, { subset: true }),
    logo = await pdf.embedPng(input.logo);
  const navy = rgb(0.118, 0.227, 0.424),
    teal = rgb(0, 0.51, 0.56),
    pale = rgb(0.93, 0.96, 0.99);
  const stamp = new Date(input.generatedAt);
  if (!Number.isFinite(stamp.getTime())) throw Error("Invalid date");
  pdf.setTitle(es ? "Experiencia SGAS" : "ESMS experience");
  pdf.setAuthor("Galápagos Life Fund");
  pdf.setCreationDate(stamp);
  pdf.setModificationDate(stamp);
  let page = pdf.addPage([595.28, 841.89]),
    y = 740;
  function header() {
    page.drawRectangle({ x: 0, y: 768, width: 596, height: 74, color: navy });
    page.drawImage(logo, { x: 48, y: 780, width: 128, height: 53 });
    page.drawText(es ? "EXPERIENCIA SGAS" : "ESMS EXPERIENCE", {
      x: 320,
      y: 805,
      size: 12,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page.drawText("GALÁPAGOS LIFE FUND", {
      x: 320,
      y: 785,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    });
    y = 740;
  }
  function next() {
    page = pdf.addPage([595.28, 841.89]);
    header();
  }
  function wrap(text: string, face: PDFFont, size: number) {
    const rows: string[] = [];
    for (const paragraph of text.replace(/\r/g, "").split("\n")) {
      let line = "";
      for (const char of paragraph) {
        if (line && face.widthOfTextAtSize(line + char, size) > 491) {
          const space = line.lastIndexOf(" ");
          if (space > 0) {
            rows.push(line.slice(0, space));
            line = line.slice(space + 1) + char;
          } else {
            rows.push(line);
            line = char;
          }
        } else line += char;
      }
      rows.push(line);
    }
    return rows;
  }
  function draw(text: string, heading = false) {
    const face = heading ? bold : font,
      size = heading ? 11 : 10,
      rows = wrap(text, face, size);
    if (heading && y < 110) next();
    for (const row of rows) {
      if (y < 65) next();
      page.drawText(row, { x: 52, y, size, font: face, color: navy });
      y -= 15;
    }
    y -= 7;
  }
  function band(text: string) {
    if (y < 130) next();
    page.drawRectangle({
      x: 46,
      y: y - 9,
      width: 503,
      height: 30,
      color: pale,
    });
    page.drawRectangle({ x: 46, y: y - 9, width: 3, height: 30, color: teal });
    page.drawText(text, { x: 56, y, size: 12, font: bold, color: navy });
    y -= 40;
  }
  header();
  draw(
    input.reference + " · " + (es ? "Revisión " : "Revision ") + input.revision,
  );
  draw((es ? "Proyecto: " : "Project: ") + input.source.project_title, true);
  draw((es ? "Proponente: " : "Applicant: ") + input.source.applicant_name);
  draw(
    new Intl.DateTimeFormat(es ? "es-EC" : "en-GB", {
      timeZone: "Pacific/Galapagos",
      dateStyle: "long",
      timeStyle: "short",
    }).format(stamp) + (es ? " · hora Galápagos" : " · Galapagos time"),
  );
  band(
    es
      ? "Evaluación de experiencia y capacidad SGAS"
      : "ESMS experience and capacity questionnaire",
  );
  draw(
    es
      ? "Respuestas declaradas por el proponente. Documento generado y anexado automáticamente; no requiere firma ni carga manual. No constituye aprobación del GLF."
      : "Answers declared by the applicant. Automatically generated and attached; no signature or manual upload is required. This document does not constitute GLF approval.",
  );
  for (const row of sgasPresentation(input.source, input.locale)) {
    // Keep each question and its answer together; long optional details may flow.
    const answer = (es ? "Respuesta: " : "Answer: ") + row.answer;
    const requiredHeight =
      (wrap(row.question, bold, 11).length + wrap(answer, font, 10).length) * 15 + 14;
    if (y - requiredHeight < 65) next();
    draw(row.question, true);
    draw(answer);
    if (row.detail?.trim())
      draw((es ? "Detalle: " : "Details: ") + row.detail.trim());
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(input.reference + " · " + (i + 1) + " / " + pages.length, {
      x: 52,
      y: 30,
      size: 8,
      font,
      color: navy,
    }),
  );
  return { bytes: await pdf.save(), pages: pages.length };
}
