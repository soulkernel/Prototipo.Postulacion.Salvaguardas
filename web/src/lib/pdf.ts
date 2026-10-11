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
        maximumFractionDigits: 0,
      }).format(v || 0);
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
          draw(
            objective.kind === "general"
              ? es
                ? "Objetivo general"
                : "General objective"
              : (es ? "Objetivo específico " : "Specific objective ") + ++i,
            true,
          );
          const text = strategicText(
            { ...payload.concept.strategic_alignment, objectives: [objective] },
            locale,
          ).alignment;
          const body = text.split("\n").slice(1);
          const sourceStart = body.findIndex((line) =>
            line.startsWith("Plan: "),
          );
          draw(
            body.slice(0, sourceStart < 0 ? undefined : sourceStart).join("\n"),
          );
        }
        field(
          es ? "Fuentes de referencia" : "Reference sources",
          strategicText(
            payload.concept.strategic_alignment,
            locale,
          ).alignment.split("\n\nPlan: ")[1]
            ? "Plan: " +
                strategicText(
                  payload.concept.strategic_alignment,
                  locale,
                ).alignment.split("\n\nPlan: ")[1]
            : payload.concept.strategic_alignment.version,
        );
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
          field(es ? "Resultado esperado" : "Expected result", r.result);
          field(
            es
              ? "Objetivo específico asociado"
              : "Associated specific objective",
            payload.concept.strategic_alignment?.objectives.find(
              (o) => o.id === r.objective_id,
            )?.text || r.objective_id,
          );
          field(es ? "Indicador" : "Indicator", r.indicator);
          field(
            es ? "Meta preliminar" : "Preliminary target",
            String(r.target ?? "—") +
              " " +
              (r.unit === "other"
                ? r.other_unit
                : resultUnits.find((u) => u[0] === r.unit)?.[es ? 1 : 2] ||
                  r.unit),
          );
          field(es ? "Evidencia prevista" : "Expected evidence", r.evidence);
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
            ? "Objetivos específicos asociados"
            : "Associated specific objectives",
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
            ? "Puntaje del riesgo (probabilidad × gravedad)"
            : "Risk score (probability × severity)",
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
