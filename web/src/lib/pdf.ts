import { conceptSections, narrativeBlocks } from "./concept-presentation";
import { budgetText } from "./budget";
import { submissionNotice } from "./grant-rules";
import { riskNarrative } from "./document-language";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import path from "node:path";
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
  rules,
  phase2Fields = [],
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
  phase2Fields?: { id: string; label_es: string; label_en: string }[];
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
          if (space > 0) {
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
    const firstRowLines = rows.length
      ? Math.max(...cells(rows[0], false).map((c) => c.length))
      : 1;
    const firstRowHeight =
      (firstRowLines <= 8 ? firstRowLines : 2) * lineHeight + 16;
    if (y < 72 + headHeight + firstRowHeight) newPage();
    header();
    for (const row of rows) {
      const parts = cells(row, false);
      const total = Math.max(...parts.map((c) => c.length));
      let offset = 0;
      // Keep short rows intact; long descriptions can still span pages.
      if (total <= 8 && Math.floor((y - 72 - 16) / lineHeight) < total) {
        newPage();
        header();
      }
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
    for (const section of conceptSections(payload.concept, locale, rules)) {
      // Keep the section explanation with the start of its content. Reserve
      // only a few table lines, rather than moving an entire long table.
      const first = section.blocks[0];
      const lead =
        first?.type === "table"
          ? Math.max(
              ...first.headers.map(
                (h, i) =>
                  lines(
                    h,
                    bold,
                    10,
                    (first.headers.length === 2
                      ? [150, 341][i]
                      : width / first.headers.length) - 16,
                  ).length,
              ),
            ) *
              14 +
            16 +
            44
          : 30;
      const sectionStart =
        lines(section.title, bold, 12).length * 15 +
        12 +
        lines(section.introduction, font, 11).length * 15 +
        9 +
        lead;
      if (y < 72 + sectionStart) newPage();
      draw(section.title, true);
      draw(section.introduction);
      for (const block of section.blocks) {
        if (block.type === "paragraph") draw(block.text);
        else {
          const widths =
            block.headers.length === 2
              ? [150, 341]
              : block.headers.length === 3
                ? [160, 190, 141]
                : block.headers.length === 4
                  ? [106, 133, 119, 133]
                  : block.headers.map(() => width / block.headers.length);
          table(block.headers, block.rows, widths);
        }
      }
    }
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
      for (const [key, value] of Object.entries(payload.phase2)) {
        const definition = phase2Fields.find((f) => f.id === key);
        field(
          definition ? (es ? definition.label_es : definition.label_en) : key,
          value,
        );
      }
    }
  } else {
    const text = (value: string) =>
      narrativeBlocks(value).forEach((b) => {
        if (b.type === "paragraph") draw(b.text);
        else
          table(
            b.headers,
            b.rows,
            b.headers.map(() => width / b.headers.length),
          );
      });
    const level = (score: number | null) =>
      ({
        incomplete: es ? "Sin completar" : "Incomplete",
        low: es ? "Bajo" : "Low",
        medium: es ? "Medio" : "Medium",
        high: es ? "Alto" : "High",
        very_high: es ? "Muy alto" : "Very high",
      })[riskLevel(score)];
    function scores(
      probability: number | null,
      severity: number | null,
      residual = false,
    ) {
      const score = riskScore(probability, severity);
      table(
        es
          ? [
              "Probabilidad (1-5)",
              "Gravedad (1-5)",
              residual ? "Puntaje residual" : "Puntaje inicial",
              "Nivel de riesgo",
            ]
          : [
              "Probability (1-5)",
              "Severity (1-5)",
              residual ? "Residual score" : "Initial score",
              "Risk level",
            ],
        [
          [
            String(probability ?? "—"),
            String(severity ?? "—"),
            score === null ? "—" : `${score}/25`,
            level(score),
          ],
        ],
        [123, 122, 123, 123],
      );
      text(riskNarrative(probability, severity, locale));
    }
    draw(
      es ? "Cómo leer esta evaluación" : "How to read this assessment",
      true,
    );
    text(
      es
        ? "Los riesgos se presentan por actividad, con la descripción y la calificación consignadas por el proponente. El puntaje inicial resulta de multiplicar la probabilidad por la gravedad; cada una se valora de 1 a 5. Las tablas facilitan comparar las evaluaciones y no sustituyen la revisión del GLF."
        : "Risks are presented by activity, with the description and ratings provided by the applicant. The initial score is probability multiplied by severity, each rated from 1 to 5. The tables help compare assessments and do not replace GLF review.",
    );
    if (stage === 1)
      text(
        es
          ? "Esta evaluación corresponde a la nota conceptual. Las medidas de mitigación, sus responsables, costos y la valoración residual se desarrollan en el proyecto completo."
          : "This assessment belongs to the concept note. Mitigation measures, responsible persons, costs and residual ratings are developed in the full proposal.",
      );
    const evaluations = payload.activities.flatMap((a) => a.risks);
    const totals = (
      dimension: "environmental" | "social" | undefined,
      residual = false,
    ) => {
      const risks = dimension
        ? evaluations.filter((r) => r.dimension === dimension)
        : evaluations;
      const scores = risks.map((r) =>
        residual
          ? riskScore(r.residual_probability, r.residual_severity)
          : riskScore(r.probability, r.severity),
      );
      const missing = scores.filter((s) => s === null).length;
      const sum = scores.reduce<number>((total, s) => total + (s ?? 0), 0);
      return !risks.length
        ? "—"
        : missing === risks.length
          ? es
            ? "Sin calificar"
            : "Not rated"
          : String(sum) +
            (missing
              ? es
                ? ` (parcial: ${missing} sin calificar)`
                : ` (partial: ${missing} not rated)`
              : "");
    };
    draw(
      es
        ? "Resumen de evaluaciones por actividad"
        : "Summary of activity-level assessments",
      true,
    );
    text(
      es
        ? "Se cuentan las evaluaciones realizadas para cada actividad. Un mismo riesgo puede aparecer en varias actividades con calificaciones distintas; por eso estos valores no representan un conteo de riesgos únicos."
        : "Assessments are counted for each activity. The same risk may appear in several activities with different ratings, so these values are not a count of unique risks.",
    );
    table(
      es
        ? [
            "Dimensión",
            "Evaluaciones",
            "Suma de puntajes iniciales",
            ...(stage === 2 ? ["Suma de puntajes residuales"] : []),
          ]
        : [
            "Dimension",
            "Assessments",
            "Sum of initial scores",
            ...(stage === 2 ? ["Sum of residual scores"] : []),
          ],
      (["environmental", "social"] as const)
        .map((d) => [
          d === "environmental"
            ? es
              ? "Ambiental"
              : "Environmental"
            : es
              ? "Social"
              : "Social",
          String(evaluations.filter((r) => r.dimension === d).length),
          totals(d),
          ...(stage === 2 ? [totals(d, true)] : []),
        ])
        .concat([
          [
            es ? "Total" : "Total",
            String(evaluations.length),
            totals(undefined),
            ...(stage === 2 ? [totals(undefined, true)] : []),
          ],
        ]),
      stage === 2 ? [110, 91, 145, 145] : [135, 115, 241],
    );
    payload.activities.forEach((a, ai) => {
      if (y < 145) newPage();
      draw((es ? "ACTIVIDAD " : "ACTIVITY ") + (ai + 1) + ": " + a.title, true);
      text(
        es
          ? "A continuación se identifican los riesgos asociados a esta actividad y se explica su valoración."
          : "The following entries identify the risks associated with this activity and explain their ratings.",
      );
      if (a.description.trim()) text(a.description);
      if (a.objective_ids?.length) {
        const objectives =
          payload.concept.strategic_alignment?.objectives.filter(
            (o) => o.kind === "specific",
          ) || [];
        const related = a.objective_ids.map((id) => {
          const index = objectives.findIndex((o) => o.id === id);
          return index < 0
            ? es
              ? "Referencia de objetivo pendiente de revisar"
              : "Objective reference pending review"
            : `${es ? "Objetivo específico" : "Specific objective"} ${index + 1}: ${objectives[index].text}`;
        });
        text(
          (es
            ? "Esta actividad contribuye a: "
            : "This activity contributes to: ") + related.join("; "),
        );
      }
      if (!a.risks.length) {
        table(
          es
            ? ["Aspecto", "Explicación del proponente"]
            : ["Item", "Applicant explanation"],
          [
            [
              es ? "Ausencia de riesgos identificados" : "No identified risks",
              a.no_risks_reason || "—",
            ],
          ],
          [150, 341],
        );
      }
      a.risks.forEach((r, ri) => {
        if (y < 150) newPage();
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
        text(
          es
            ? `Se identifica el siguiente riesgo ${r.dimension === "environmental" ? "ambiental" : "social"} durante la actividad «${a.title}».`
            : `The following ${r.dimension === "environmental" ? "environmental" : "social"} risk is identified during «${a.title}».`,
        );
        table(
          es
            ? ["Aspecto", "Información presentada"]
            : ["Item", "Submitted information"],
          [
            [es ? "Riesgo identificado" : "Identified risk", r.name || "—"],
            [
              es ? "Descripción del riesgo" : "Risk description",
              r.description || "—",
            ],
            ...(r.performance_standard
              ? [
                  [
                    es
                      ? "Norma de desempeño asociada"
                      : "Associated performance standard",
                    r.performance_standard,
                  ],
                ]
              : []),
          ],
          [150, 341],
        );
        scores(r.probability, r.severity);
        if (stage === 2) {
          draw(
            es
              ? "Medidas y valoración después de su aplicación"
              : "Measures and assessment after implementation",
            true,
          );
          text(
            es
              ? "Las siguientes medidas describen cómo se propone atender el riesgo. La valoración residual expresa el riesgo que se prevé que permanezca después de aplicarlas."
              : "The following measures describe how the applicant proposes to address the risk. The residual assessment describes the risk expected to remain after implementation.",
          );
          table(
            es
              ? ["Medida propuesta", "Referencia normativa"]
              : ["Proposed measure", "Normative reference"],
            r.measures.length
              ? r.measures.map((m) => [
                  m.text ||
                    (es ? m.label_es : m.label_en) ||
                    m.label_es ||
                    m.label_en ||
                    m.catalog_id ||
                    "—",
                  m.normative_reference ||
                    (es
                      ? "Propuesta del aplicante; requiere validación GLF."
                      : "Applicant proposal; requires GLF validation."),
                ])
              : [[es ? "No consignada" : "Not provided", "—"]],
            [260, 231],
          );
          scores(r.residual_probability, r.residual_severity, true);
          table(
            es
              ? ["Implementación", "Información prevista"]
              : ["Implementation", "Planned information"],
            [
              [es ? "Ubicación" : "Location", r.location || "—"],
              [
                es ? "Costo estimado (USD)" : "Estimated cost (USD)",
                r.cost === null ? "—" : String(r.cost),
              ],
              [
                es
                  ? "Responsable de implementar la medida"
                  : "Person responsible for implementation",
                r.responsible || "—",
              ],
              [
                es
                  ? "Trimestre de inicio / fin / duración"
                  : "Start quarter / end quarter / duration",
                `${r.start_quarter ?? "—"} / ${r.end_quarter ?? "—"} / ${r.end_quarter && r.start_quarter ? r.end_quarter - r.start_quarter + 1 : "—"}`,
              ],
            ],
            [150, 341],
          );
        }
      });
    });
    text(
      es
        ? "Las sumas de puntajes no determinan una categoría global. La valoración institucional corresponde al equipo de Sostenibilidad GLF."
        : "Score totals do not determine an overall category. Institutional assessment belongs to GLF Sustainability.",
    );
  }
  // Reserve the complete signature block so it never splits across pages.
  const signer =
    payload.concept.contact_name.trim() || "________________________________";
  const signerLines = lines(signer, font, 11);
  if (kind === "concept" && stage === 2 && payload.budget?.lines.length) {
    draw(es ? "PRESUPUESTO ANUAL" : "ANNUAL BUDGET", true);
    draw(budgetText(payload.budget, locale));
  }
  const signatureHeight = 180 + signerLines.length * 15;
  if (y < signatureHeight + 80) newPage();
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
