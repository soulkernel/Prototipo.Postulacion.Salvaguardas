import { callThemeLabel } from "./call-themes";
import { budgetText } from "./budget";
import { submissionNotice } from "./grant-rules";
import { alignmentNarrative, riskNarrative } from "./document-language";
import { resultUnits } from "@/lib/project-results";
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
  rules,
}: {
  payload: Payload;
  reference: string;
  revision: number;
  submittedAt: string;
  kind: "concept" | "matrix";
  locale: Locale;
  downloadUrl: string;
  stage: number;
  rules?: unknown;
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
      y: 809,
      size: 10,
      font: bold,
      color: rgb(1, 1, 1),
    });
    const headerLines =
      kind === "concept"
        ? [
            stage === 1
              ? es
                ? "Nota conceptual"
                : "Concept note"
              : es
                ? "Propuesta completa"
                : "Full project proposal",
          ]
        : es
          ? ["Evaluación de riesgos", "ambientales y sociales"]
          : ["Environmental and social", "risk assessment"];
    headerLines.forEach((line, i) =>
      page.drawText(line, {
        x: 310,
        y: 790 - i * 13,
        size: 10,
        font,
        color: rgb(1, 1, 1),
      }),
    );
    y = 741;
  }
  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    pageHeader();
  }
  pageHeader();
  function lines(
    value: string,
    font: PDFFont,
    size: number,
    availableWidth = width,
  ) {
    const result: string[] = [];
    for (const paragraph of value
      .replace(/\r/g, "")
      .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")
      .trim()
      .split("\n")) {
      let current = "";
      for (const char of Array.from(paragraph)) {
        if (
          font.widthOfTextAtSize(current + char, size) > availableWidth &&
          current
        ) {
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

  // Split long rows across pages and repeat column labels; never reserve a whole
  // narrative block that would leave a large unused part of the current page.
  function table(headers: string[], rows: string[][], widths: number[]) {
    const lineHeight = 14;
    function cells(values: string[], heading: boolean) {
      return values.map((v, i) =>
        lines(v || "—", heading ? bold : font, 10, widths[i] - 16),
      );
    }
    function paint(
      parts: string[][],
      offset: number,
      count: number,
      heading: boolean,
    ) {
      const height = count * lineHeight + 16;
      let x = 52;
      parts.forEach((column, i) => {
        page.drawRectangle({
          x,
          y: y - height + 4,
          width: widths[i],
          height,
          color: heading ? pale : rgb(1, 1, 1),
          borderColor: rgb(0.82, 0.85, 0.88),
          borderWidth: 0.5,
        });
        column.slice(offset, offset + count).forEach((text, j) => {
          page.drawText(text, {
            x: x + 8,
            y: y - 10 - j * lineHeight,
            size: 10,
            font: heading ? bold : font,
            color: rgb(0, 0, 0),
          });
        });
        x += widths[i];
      });
      y -= height;
    }
    const head = cells(headers, true);
    const headCount = Math.max(...head.map((c) => c.length));
    const headHeight = headCount * lineHeight + 16;
    function header() {
      paint(head, 0, headCount, true);
    }
    if (y < 72 + headHeight + 44) newPage();
    header();
    for (const row of rows) {
      const parts = cells(row, false);
      const total = Math.max(...parts.map((c) => c.length));
      let offset = 0;
      while (offset < total) {
        let count = Math.floor((y - 72 - 16) / lineHeight);
        if (count < 1) {
          newPage();
          header();
          count = Math.floor((y - 72 - 16) / lineHeight);
        }
        count = Math.min(count, total - offset);
        paint(parts, offset, count, false);
        offset += count;
      }
    }
    y -= 14;
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
        draw(es ? "ALINEACIÓN ESTRATÉGICA" : "STRATEGIC ALIGNMENT", true);
        let i = 0;
        for (const objective of payload.concept.strategic_alignment
          .objectives) {
          const narrative = alignmentNarrative(objective, locale);
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
        draw(
          es
            ? "Cada resultado se vincula con un objetivo específico y se expresa mediante un indicador y una meta preliminar."
            : "Each result is linked to a specific objective and described by an indicator and a preliminary target.",
        );
        payload.concept.project_results.forEach((r, i) => {
          draw((es ? "Resultado " : "Result ") + (i + 1), true, false);
          const objective =
            payload.concept.strategic_alignment?.objectives.find(
              (o) => o.id === r.objective_id,
            )?.text || r.objective_id;
          table(
            es
              ? ["Resultado esperado", "Indicador", "Meta preliminar"]
              : ["Expected result", "Indicator", "Preliminary target"],
            [
              [
                r.result,
                r.indicator,
                String(r.target ?? "—") +
                  " " +
                  (r.unit === "other"
                    ? r.other_unit
                    : resultUnits.find((u) => u[0] === r.unit)?.[es ? 1 : 2] ||
                      r.unit),
              ],
            ],
            [196, 185, 110],
          );
          table(
            es
              ? ["Relación y verificación", "Descripción"]
              : ["Alignment and verification", "Description"],
            [
              [
                es
                  ? "Objetivo específico al que contribuye"
                  : "Specific objective supported",
                objective,
              ],
              [es ? "Evidencia prevista" : "Planned evidence", r.evidence],
            ],
            [150, 341],
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
      if (
        fieldSpec.key === "beneficiaries" ||
        fieldSpec.key === "sustainability" ||
        fieldSpec.key === "results"
      ) {
        draw(es ? fieldSpec.es : fieldSpec.en, true);
        draw(
          fieldSpec.key === "beneficiaries"
            ? es
              ? "Esta sección describe a quién beneficia el proyecto y su contribución a los medios de vida."
              : "This section describes who benefits from the project and its contribution to livelihoods."
            : fieldSpec.key === "sustainability"
              ? es
                ? "Esta sección describe la continuidad de los beneficios y las posibilidades de replicar la iniciativa."
                : "This section describes the continuity of benefits and opportunities to replicate the initiative."
              : es
                ? "Resultados e indicadores consignados por el postulante."
                : "Results and indicators provided by the applicant.",
        );
        table(
          es
            ? ["Apartado", "Información presentada"]
            : ["Section", "Submitted information"],
          [
            [
              es ? fieldSpec.es : fieldSpec.en,
              String(payload.concept[fieldSpec.key] || "—"),
            ],
          ],
          [140, 351],
        );
        continue;
      }
      field(
        es ? fieldSpec.es : fieldSpec.en,
        fieldSpec.key === "project_type"
          ? callThemeLabel(payload.concept.project_type, rules, locale)
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
        if (r.performance_standard)
          field(
            es
              ? "Norma de desempeño asociada"
              : "Associated performance standard",
            r.performance_standard,
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
      es
        ? "La suma de los puntajes individuales es"
        : "The sum of individual scores is",
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
  if (kind === "concept" && payload.budget?.lines.length) {
    draw(es ? "PRESUPUESTO ANUAL" : "ANNUAL BUDGET", true);
    draw(budgetText(payload.budget, locale));
  }
  const signatureHeight = 180 + signerLines.length * 15;
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
  page.drawText(es ? "Firma electrónica" : "Electronic signature", {
    x: 58,
    y: signatureTop - 22,
    size: 12,
    font: bold,
    color: rgb(0, 0, 0),
  });
  // Keep sufficient space between the heading and the signer's name.
  signerLines.forEach((line, i) =>
    page.drawText(line, {
      x: 58,
      y: signatureBottom + 55 + (signerLines.length - 1 - i) * 15,
      size: 11,
      font: bold,
      color: rgb(0, 0, 0),
    }),
  );
  page.drawText(es ? "Responsable del proyecto" : "Project lead", {
    x: 58,
    y: signatureBottom + 36,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
  const generationDate = new Intl.DateTimeFormat(es ? "es-EC" : "en-GB", {
    timeZone: "Pacific/Galapagos",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(stamp);
  page.drawText(
    generationDate + (es ? " (hora Galápagos)" : " (Galapagos time)"),
    { x: 58, y: signatureBottom + 17, size: 9, font, color: rgb(0, 0, 0) },
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
  draw(submissionNotice[locale]);
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
