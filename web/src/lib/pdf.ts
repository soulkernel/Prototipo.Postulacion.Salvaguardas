import { alignmentNarrative, riskNarrative } from "./document-language";
import { resultText, resultUnits } from "@/lib/project-results";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { identityFields, narrativeFields } from "./fields";
import { hasSummaryParts, summarySections } from "./summary";
import { strategicText } from "./strategic-alignment";
import { riskLabel, synchronizeRisks } from "./potential-risks";
import { riskScore, type Payload, type Locale } from "./domain";
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
  payload = synchronizeRisks(payload);
  if (payload.concept.strategic_alignment)
    payload = {
      ...payload,
      concept: {
        ...payload.concept,
        ...strategicText(payload.concept.strategic_alignment, locale),
      },
    };
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
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
  pdf.setSubject(payload.concept.title);
  let page = pdf.addPage([595.28, 841.89]);
  const navy = rgb(30 / 255, 58 / 255, 108 / 255);
  const pale = rgb(0.94, 0.96, 0.98);
  const logo = await pdf.embedPng(
    await readFile(path.join(process.cwd(), "public", "glf-logo.png")),
  );
  let y = 790;
  const width = 491;
  function pageHeader() {
    page.drawRectangle({
      x: 0,
      y: 768,
      width: 595.28,
      height: 74,
      color: navy,
    });
    page.drawImage(logo, { x: 52, y: 779, width: 128, height: 53 });
    page.drawText("GALÁPAGOS LIFE FUND", {
      x: 310,
      y: 801,
      size: 10,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page.drawText(es ? "Portal de subvenciones" : "Grants portal", {
      x: 310,
      y: 783,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    });
    y = 741;
  }
  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    pageHeader();
  }
  pageHeader();
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
  function draw(text: string, heading = false, band = heading) {
    const size = heading ? 12 : 11;
    const face = heading ? bold : font;
    const wrapped = lines(text, face, size);
    if (heading && y < 72 + wrapped.length * 15 + 55) newPage();
    if (band) {
      page.drawRectangle({
        x: 46,
        y: y - wrapped.length * 15 + 1,
        width: 503,
        height: wrapped.length * 15 + 13,
        color: pale,
      });
      page.drawRectangle({
        x: 46,
        y: y - wrapped.length * 15 + 1,
        width: 3,
        height: wrapped.length * 15 + 13,
        color: navy,
      });
    }
    for (const line of wrapped) {
      if (y < 72) newPage();
      page.drawText(line, { x: 52, y, size, font: face, color: rgb(0, 0, 0) });
      y -= 15;
    }
    y -= heading ? 12 : 9;
  }
  function field(label: string, value: unknown) {
    if (y < 72 + lines(label, bold, 12).length * 15 + 35) newPage();
    draw(label, true, false);
    draw(String(value ?? "—") || "—");
  }

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
      new Intl.DateTimeFormat(es ? "es-EC" : "en-GB", {
        timeZone: "Pacific/Galapagos",
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(stamp) +
      " · Galápagos (UTC−06:00)",
  );
  field(es ? "Proyecto" : "Project", payload.concept.title);
  if (kind === "concept") {
    const money = (v: number | null) =>
      new Intl.NumberFormat(es ? "es-EC" : "en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v ?? 0);
    const cards = [
      [
        es ? "Solicitado al GLF" : "Requested from GLF",
        money(payload.concept.requested_amount),
      ],
      [
        es ? "Cofinanciamiento" : "Cofinancing",
        money(payload.concept.cofinance_amount),
      ],
    ];
    cards.forEach(([label, value], i) => {
      const x = 46 + i * 257;
      page.drawRectangle({
        x,
        y: y - 54,
        width: 246,
        height: 64,
        color: pale,
        borderColor: rgb(0.83, 0.87, 0.91),
        borderWidth: 0.5,
      });
      page.drawText(label, {
        x: x + 12,
        y: y - 10,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(value, {
        x: x + 12,
        y: y - 33,
        size: 12,
        font: bold,
        color: rgb(0, 0, 0),
      });
    });
    y -= 80;
    draw(
      es
        ? `Se solicita al GLF un financiamiento de ${payload.concept.requested_amount === null ? "monto no consignado" : money(payload.concept.requested_amount)} y se prevé un cofinanciamiento de ${payload.concept.cofinance_amount === null ? "monto no consignado" : money(payload.concept.cofinance_amount)}.`
        : `The applicant requests ${payload.concept.requested_amount === null ? "an unspecified amount" : money(payload.concept.requested_amount)} from GLF and plans cofinancing of ${payload.concept.cofinance_amount === null ? "an unspecified amount" : money(payload.concept.cofinance_amount)}.`,
    );
    draw(es ? "1. DATOS GENERALES" : "1. PROJECT DETAILS", true);
    for (const fieldSpec of [...identityFields, ...narrativeFields]) {
      if (fieldSpec.key === "title") continue;
      if (
        fieldSpec.key === "alignment" &&
        payload.concept.strategic_alignment?.objectives.length
      ) {
        if (y < 380) newPage();
        draw(es ? "ALINEACIÓN ESTRATÉGICA" : "STRATEGIC ALIGNMENT", true);
        let i = 0;
        for (const objective of payload.concept.strategic_alignment
          .objectives) {
          const narrative = alignmentNarrative(objective, locale);
          const blockHeight =
            50 +
            narrative.reduce(
              (total, paragraph) =>
                total + lines(paragraph, font, 11).length * 15 + 9,
              0,
            );
          if (y < 72 + Math.min(blockHeight, 500)) newPage();
          draw(
            objective.kind === "general"
              ? es
                ? "Objetivo general"
                : "General objective"
              : (es ? "Objetivo específico " : "Specific objective ") + ++i,
            true,
          );
          for (const paragraph of narrative) draw(paragraph);
        }
        continue;
      }
      if (fieldSpec.key === "summary")
        draw(
          es ? "2. DESCRIPCIÓN DEL PROYECTO" : "2. PROJECT DESCRIPTION",
          true,
        );
      if (
        fieldSpec.key === "objectives" &&
        payload.concept.strategic_alignment?.objectives.length
      ) {
        draw(es ? "OBJETIVOS" : "OBJECTIVES", true);
        let specific = 0;
        for (const objective of payload.concept.strategic_alignment
          .objectives) {
          field(
            objective.kind === "general"
              ? es
                ? "Objetivo general"
                : "General objective"
              : (es ? "Objetivo específico " : "Specific objective ") +
                  ++specific,
            objective.text,
          );
        }
        continue;
      }
      if (
        fieldSpec.key === "results" &&
        payload.concept.project_results?.length
      ) {
        draw(es ? "RESULTADOS E INDICADORES" : "RESULTS AND INDICATORS", true);
        payload.concept.project_results.forEach((r, i) => {
          draw((es ? "Resultado " : "Result ") + (i + 1), true);
          field(
            es
              ? "Se espera alcanzar el siguiente resultado"
              : "The following result is expected",
            r.result,
          );
          field(
            es
              ? "Este resultado contribuye al siguiente objetivo específico"
              : "This result contributes to the following specific objective",
            payload.concept.strategic_alignment?.objectives.find(
              (o) => o.id === r.objective_id,
            )?.text || r.objective_id,
          );
          field(
            es
              ? "El resultado se medirá mediante el siguiente indicador"
              : "The result will be measured using the following indicator",
            r.indicator,
          );
          field(
            es
              ? "La meta preliminar prevista es"
              : "The planned preliminary target is",
            String(r.target ?? "—") +
              " " +
              (r.unit === "other"
                ? r.other_unit
                : resultUnits.find((u) => u[0] === r.unit)?.[es ? 1 : 2] ||
                  r.unit),
          );
          field(
            es
              ? "El cumplimiento se comprobará mediante la siguiente evidencia"
              : "Achievement will be verified using the following evidence",
            r.evidence,
          );
        });
        continue;
      }
      if (
        fieldSpec.key === "summary" &&
        payload.concept.summary_parts &&
        hasSummaryParts(payload.concept.summary_parts)
      ) {
        draw(es ? "RESUMEN DEL PROYECTO" : "PROJECT SUMMARY", true);
        for (const section of summarySections)
          field(
            es ? section.es : section.en,
            payload.concept.summary_parts[section.key],
          );
        continue;
      }
      field(
        es ? fieldSpec.es : fieldSpec.en,
        fieldSpec.key === "results"
          ? resultText(payload.concept, locale)
          : fieldSpec.key === "partners" &&
              payload.concept.associated_organizations
            ? payload.concept.associated_organizations
                .map((name, i) => `${i + 1}. ${name}`)
                .join("\n")
            : Array.isArray(payload.concept[fieldSpec.key])
              ? (payload.concept[fieldSpec.key] as string[]).join(", ")
              : payload.concept[fieldSpec.key],
      );
    }
    field(
      es ? "Tipo de solicitante" : "Applicant type",
      payload.concept.applicant_type,
    );
    field(
      es ? "Categoría elegida" : "Selected category",
      payload.concept.category_id,
    );
    draw(es ? "3. ACTIVIDADES" : "3. ACTIVITIES", true);
    payload.activities.forEach((a, i) => {
      field(i + 1 + ". " + a.title, a.description);
      if (a.objective_ids?.length)
        field(
          es
            ? "Esta actividad contribuye a los siguientes objetivos específicos"
            : "This activity contributes to the following specific objectives",
          a.objective_ids
            .map(
              (id) =>
                payload.concept.strategic_alignment?.objectives.find(
                  (o) => o.id === id,
                )?.text || id,
            )
            .join("; "),
        );
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
      if (y < (a.risks.length ? 360 : 180)) newPage();
      draw((es ? "ACTIVIDAD " : "ACTIVITY ") + (ai + 1) + ": " + a.title, true);
      if (!a.risks.length)
        field(
          es
            ? "Sin riesgos identificados: justificación"
            : "No identified risks: explanation",
          a.no_risks_reason,
        );
      a.risks.forEach((r, ri) => {
        const estimatedHeight =
          190 +
          lines(r.description || "—", font, 11).length * 15 +
          lines(r.name || "—", font, 11).length * 15;
        if (y < 72 + Math.min(estimatedHeight, 440)) newPage();
        draw(
          (es ? "Riesgo " : "Risk ") +
            (ai + 1) +
            "." +
            (ri + 1) +
            (r.source_id
              ? " · " +
                riskLabel(
                  payload.concept.risk_register || [],
                  r.source_id,
                  locale,
                )
              : ""),
          true,
        );
        field(
          es
            ? "Riesgo identificado durante esta actividad"
            : "Risk identified during this activity",
          es
            ? `Se identifica el siguiente riesgo ${r.dimension === "environmental" ? "ambiental" : "social"}: ${r.name}`
            : `The following ${r.dimension === "environmental" ? "environmental" : "social"} risk is identified: ${r.name}`,
        );
        field(
          es
            ? "Descripción del riesgo presentada por el aplicante"
            : "Risk description provided by the applicant",
          r.description,
        );
        const score = riskScore(r.probability, r.severity);
        sum += score || 0;

        field(
          es
            ? "Puntaje del riesgo (probabilidad × gravedad)"
            : "Risk score (probability × severity)",
          riskNarrative(r.probability, r.severity, locale),
        );
        if (stage === 2) {
          for (const m of r.measures) {
            field(
              es
                ? "Para atender este riesgo se propone la siguiente medida"
                : "The following measure is proposed to address this risk",
              m.text ||
                (es ? m.label_es : m.label_en) ||
                m.label_es ||
                m.label_en ||
                m.catalog_id,
            );
            if (m.normative_reference)
              field(
                es
                  ? "La medida se vincula con la siguiente referencia normativa"
                  : "The measure is linked to the following normative reference",
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
            riskNarrative(r.residual_probability, r.residual_severity, locale),
          );
          field(es ? "Ubicación" : "Location", r.location);
          field(es ? "Costo estimado (USD)" : "Estimated cost (USD)", r.cost);
          field(
            es
              ? "La implementación de la medida estará a cargo de"
              : "Implementation of the measure will be assigned to",
            r.responsible,
          );
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
      es ? "La suma de los puntajes individuales es" : "The sum of individual scores is",
      sum,
    );
    draw(
      es
        ? "La suma no determina una categoría global. La valoración institucional corresponde al equipo de Sostenibilidad GLF."
        : "The sum does not determine an overall category. Institutional assessment belongs to GLF Sustainability.",
    );
  }
  // Reserve the complete signature block so it never splits across pages.
  const signer =
    payload.concept.contact_name.trim() || "________________________________";
  const signerLines = lines(signer, font, 11);
  const signatureHeight = 152 + signerLines.length * 15;
  if (y < signatureHeight + 310) newPage();
  const signatureTop = y - 8;
  const signatureBottom = signatureTop - signatureHeight;
  page.drawRectangle({
    x: 46,
    y: signatureBottom,
    width: 503,
    height: signatureHeight,
    borderColor: rgb(0.65, 0.71, 0.78),
    borderWidth: 0.8,
  });
  page.drawRectangle({
    x: 46,
    y: signatureTop - 32,
    width: 503,
    height: 32,
    color: pale,
  });
  page.drawText(
    es ? "RESPONSABLE DEL PROYECTO" : "PROJECT RESPONSIBLE PERSON",
    {
      x: 58,
      y: signatureTop - 21,
      size: 12,
      font: bold,
      color: rgb(0, 0, 0),
    },
  );
  page.drawText(es ? "Nombre:" : "Name:", {
    x: 58,
    y: signatureTop - 52,
    size: 11,
    font: bold,
    color: rgb(0, 0, 0),
  });
  signerLines.forEach((line, i) =>
    page.drawText(line, {
      x: 58,
      y: signatureTop - 70 - i * 15,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    }),
  );
  page.drawText(
    es ? "Espacio para firma electrónica" : "Electronic signature area",
    {
      x: 58,
      y: signatureBottom + 13,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    },
  );
  y = signatureBottom - 18;

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
