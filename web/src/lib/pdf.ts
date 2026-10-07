import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { identityFields, narrativeFields } from "./fields";
import { riskScore, riskLevel, type Payload, type Locale } from "./domain";
export async function applicationPdf({
  payload,
  reference,
  revision,
  submittedAt,
  kind,
  locale,
  downloadUrl,
  stage,
}: {
  payload: Payload;
  reference: string;
  revision: number;
  submittedAt: string;
  kind: "concept" | "matrix";
  locale: Locale;
  downloadUrl: string;
  stage: number;
}) {
  const es = locale === "es";
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const levelLabel = (score: number | null) =>
    ({
      incomplete: ["Incompleto", "Incomplete"],
      low: ["Bajo", "Low"],
      medium: ["Medio", "Medium"],
      high: ["Alto", "High"],
      very_high: ["Muy alto", "Very high"],
    })[riskLevel(score)][es ? 0 : 1];
  const folder = path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans",
    "files",
  );
  const [regular, boldBytes] = await Promise.all([
    readFile(path.join(folder, "noto-sans-latin-400-normal.woff")),
    readFile(path.join(folder, "noto-sans-latin-700-normal.woff")),
  ]);
  const font = await pdf.embedFont(regular, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const stamp = new Date(submittedAt);
  pdf.setCreationDate(stamp);
  pdf.setModificationDate(stamp);
  pdf.setTitle(reference + " · " + kind + " · v" + revision);
  pdf.setAuthor("Galápagos Life Fund");
  let page = pdf.addPage([595.28, 841.89]);
  let y = 790;
  const width = 491;
  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    y = 790;
  }
  function lines(value: string, font: PDFFont, size: number) {
    const result: string[] = [];
    for (const paragraph of value.replace(/\r/g, "").split("\n")) {
      let current = "";
      for (const char of Array.from(paragraph)) {
        if (font.widthOfTextAtSize(current + char, size) > width && current) {
          const space = current.lastIndexOf(" ");
          if (space > current.length / 2) {
            result.push(current.slice(0, space));
            current = current.slice(space + 1) + char;
          } else {
            result.push(current);
            current = char;
          }
        } else current += char;
      }
      result.push(current);
    }
    return result;
  }
  function draw(text: string, heading = false) {
    const size = heading ? 12 : 11;
    const face = heading ? bold : font;
    for (const line of lines(text, face, size)) {
      if (y < 72) newPage();
      page.drawText(line, { x: 52, y, size, font: face, color: rgb(0, 0, 0) });
      y -= 15;
    }
    y -= heading ? 5 : 9;
  }
  function field(label: string, value: unknown) {
    if (y < 72 + lines(label, bold, 12).length * 15 + 35) newPage();
    draw(label, true);
    draw(String(value ?? "—") || "—");
  }
  draw("GALÁPAGOS LIFE FUND", true);
  draw(
    kind === "concept"
      ? es
        ? "NOTA CONCEPTUAL"
        : "CONCEPT NOTE"
      : es
        ? stage === 1
          ? "SCREENING AMBIENTAL Y SOCIAL"
          : "MATRIZ COMPLETA DE RIESGOS Y PGAS"
        : stage === 1
          ? "ENVIRONMENTAL AND SOCIAL SCREENING"
          : "FULL RISK MATRIX AND ESMP",
    true,
  );
  draw(
    reference +
      " · " +
      (es ? "Versión" : "Version") +
      " " +
      revision +
      " · " +
      stamp.toISOString(),
  );
  if (kind === "concept") {
    for (const fieldSpec of [...identityFields, ...narrativeFields])
      field(
        es ? fieldSpec.es : fieldSpec.en,
        Array.isArray(payload.concept[fieldSpec.key])
          ? (payload.concept[fieldSpec.key] as string[]).join(", ")
          : payload.concept[fieldSpec.key],
      );
    field(
      es ? "Tipo de solicitante" : "Applicant type",
      payload.concept.applicant_type,
    );
    field(
      es ? "Categoría elegida" : "Selected category",
      payload.concept.category_id,
    );
    draw(es ? "ACTIVIDADES" : "ACTIVITIES", true);
    payload.activities.forEach((a, i) => {
      field(i + 1 + ". " + a.title, a.description);
      if (!a.risks.length)
        field(
          es
            ? "Justificación de ausencia de riesgos identificados"
            : "Explanation of no identified risks",
          a.no_risks_reason,
        );
    });
    if (stage === 2 && Object.keys(payload.phase2 || {}).length) {
      draw(
        es ? "APARTADOS DE PROYECTO COMPLETO" : "FULL PROPOSAL SECTIONS",
        true,
      );
      for (const [key, value] of Object.entries(payload.phase2))
        field(key, value);
    }
  } else {
    let sum = 0;
    payload.activities.forEach((a, ai) => {
      draw((es ? "ACTIVIDAD " : "ACTIVITY ") + (ai + 1) + ": " + a.title, true);
      if (!a.risks.length)
        field(
          es
            ? "Sin riesgos identificados: justificación"
            : "No identified risks: explanation",
          a.no_risks_reason,
        );
      a.risks.forEach((r, ri) => {
        draw((es ? "Riesgo " : "Risk ") + (ai + 1) + "." + (ri + 1), true);
        field(
          es ? "Nombre y dimensión" : "Name and dimension",
          r.name +
            " · " +
            (r.dimension === "environmental"
              ? es
                ? "Ambiental"
                : "Environmental"
              : "Social"),
        );
        field(es ? "Descripción" : "Description", r.description);
        const score = riskScore(r.probability, r.severity);
        sum += score || 0;
        const residual = riskScore(r.residual_probability, r.residual_severity);
        field(
          es
            ? "Probabilidad × gravedad inicial"
            : "Initial probability × severity",
          r.probability +
            " × " +
            r.severity +
            " = " +
            score +
            " · " +
            levelLabel(score),
        );
        if (stage === 2) {
          for (const m of r.measures) {
            field(
              es ? "Medida de mitigación" : "Mitigation measure",
              m.text ||
                (es ? m.label_es : m.label_en) ||
                m.label_es ||
                m.label_en ||
                m.catalog_id,
            );
            if (m.normative_reference)
              field(
                es ? "Referencia normativa" : "Normative reference",
                m.normative_reference,
              );
            else
              draw(
                es
                  ? "Propuesta del aplicante; requiere validación GLF."
                  : "Applicant proposal; requires GLF validation.",
              );
          }
          field(
            es
              ? "Probabilidad × gravedad residual"
              : "Residual probability × severity",
            r.residual_probability +
              " × " +
              r.residual_severity +
              " = " +
              residual +
              " · " +
              levelLabel(residual),
          );
          field(es ? "Ubicación" : "Location", r.location);
          field(es ? "Costo estimado (USD)" : "Estimated cost (USD)", r.cost);
          field(es ? "Responsable" : "Responsible person", r.responsible);
          field(
            es
              ? "Inicio / fin / duración (trimestres)"
              : "Start / end / duration (quarters)",
            r.start_quarter +
              " / " +
              r.end_quarter +
              " / " +
              (r.end_quarter && r.start_quarter
                ? r.end_quarter - r.start_quarter + 1
                : "—"),
          );
        }
      });
    });
    field(
      es ? "Suma de puntajes individuales" : "Sum of individual scores",
      sum,
    );
    draw(
      es
        ? "La suma no determina una categoría global. La valoración institucional corresponde al equipo de Sostenibilidad GLF."
        : "The sum does not determine an overall category. Institutional assessment belongs to GLF Sustainability.",
    );
  }
  if (y < 230) newPage();
  draw(es ? "RECUPERAR ESTA VERSIÓN" : "RETRIEVE THIS VERSION", true);
  draw(
    es
      ? "El siguiente QR permite descargar nuevamente esta versión. Requiere iniciar sesión con una cuenta autorizada."
      : "This QR lets you download this version again. Sign in with an authorized account.",
  );
  const qr = await pdf.embedPng(
    await QRCode.toBuffer(downloadUrl, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: "M",
    }),
  );
  page.drawImage(qr, { x: 52, y: y - 100, width: 100, height: 100 });
  y -= 118;
  draw(
    es
      ? "La postulación y sus calificaciones declaradas están sujetas a revisión humana del GLF."
      : "The application and its declared ratings are subject to human review by GLF.",
  );
  const pages = pdf.getPages();
  for (let i = 0; i < pages.length; i++)
    pages[i].drawText(reference + " · " + (i + 1) + " / " + pages.length, {
      x: 52,
      y: 35,
      size: 8,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  return { bytes: await pdf.save(), pages: pages.length };
}
