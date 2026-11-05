import { rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { riskLevel, type Locale } from "./domain";
import {
  riskMapColors,
  riskMapLevels,
  riskMapNames,
  riskMapRanges,
  riskMapSummary,
  riskMapText,
  type RiskMapEntry,
} from "./risk-map";

// Measure the entire block before painting so the map and its reading guide
// always stay together, even when the preceding project title is very long.
export function readableRiskMapPdf(
  entries: RiskMapEntry[],
  locale: Locale,
  residual: boolean,
  font: PDFFont,
  bold: PDFFont,
) {
  const copy = riskMapText[locale];
  const summary = riskMapSummary(entries, locale);
  const operations: Array<(page: PDFPage, top: number) => void> = [];
  const left = 52,
    width = 491;
  let offset = 0;
  function text(
    value: string,
    size = 10,
    strong = false,
    indent = 0,
    availableWidth = width,
    gap = 6,
  ) {
    const face = strong ? bold : font;
    const lines: string[] = [];
    let line = "";
    for (const word of value.split(/\s+/u)) {
      const candidate = line ? line + " " + word : word;
      if (face.widthOfTextAtSize(candidate, size) > availableWidth && line) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    for (const line of lines) {
      const at = offset;
      operations.push((page, top) =>
        page.drawText(line, {
          x: left + indent,
          y: top - at,
          size,
          font: face,
        }),
      );
      offset += size + 4;
    }
    offset += gap;
  }
  operations.push((page, top) => {
    page.drawRectangle({
      x: 46,
      y: top - 9,
      width: 503,
      height: 22,
      color: rgb(0.94, 0.96, 0.98),
    });
    page.drawRectangle({
      x: 46,
      y: top - 9,
      width: 3,
      height: 22,
      color: rgb(0.12, 0.23, 0.42),
    });
  });
  text(
    (residual ? copy.residual : copy.initial).toLocaleUpperCase(locale),
    12,
    true,
  );
  text(residual ? copy.after : copy.before, 10);
  text(copy.intro);
  const summaryTop = offset;
  const summaryOperation = operations.length;
  offset += 12;
  text(summary.text, 10, true, 10, width - 20, 6);
  const summaryHeight = offset - summaryTop;
  operations.splice(summaryOperation, 0, (page, top) => {
    page.drawRectangle({
      x: left,
      y: top - summaryTop - summaryHeight + 5,
      width,
      height: summaryHeight + 6,
      color: rgb(0.94, 0.96, 0.98),
    });
  });
  offset += 16;
  text(copy.severity, 10, true, 0, width, 0);
  text(copy.severityHelp + " · " + copy.scale, 9, false, 0, width, 7);
  const gridTop = offset,
    gridLeft = 83,
    cellWidth = 90,
    cellHeight = 34;
  operations.push((page, top) => {
    for (let severity = 5; severity >= 1; severity--) {
      const y = top - gridTop - (6 - severity) * cellHeight;
      page.drawText(String(severity), {
        x: 63,
        y: y + 12,
        size: 10,
        font: bold,
      });
      for (let probability = 1; probability <= 5; probability++) {
        const x = gridLeft + (probability - 1) * cellWidth;
        const color = riskMapColors[riskLevel(probability * severity)];
        page.drawRectangle({
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          color: rgb(color[0], color[1], color[2]),
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 0.5,
        });
        const count = summary.complete.filter(
          (e) => e.probability === probability && e.severity === severity,
        ).length;
        if (!count) continue;
        page.drawRectangle({
          x: x + 7,
          y: y + 3,
          width: cellWidth - 14,
          height: cellHeight - 6,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.12, 0.23, 0.42),
          borderWidth: 1,
        });
        const number = String(count);
        page.drawText(number, {
          x: x + (cellWidth - bold.widthOfTextAtSize(number, 12)) / 2,
          y: y + 17,
          size: 12,
          font: bold,
        });
        const label =
          locale === "es"
            ? count === 1
              ? "evaluación"
              : "evaluaciones"
            : count === 1
              ? "assessment"
              : "assessments";
        page.drawText(label, {
          x: x + (cellWidth - font.widthOfTextAtSize(label, 8)) / 2,
          y: y + 7,
          size: 8,
          font,
        });
      }
    }
    for (let p = 1; p <= 5; p++)
      page.drawText(String(p), {
        x: gridLeft + (p - 0.5) * cellWidth - 3,
        y: top - gridTop - cellHeight * 5 - 14,
        size: 10,
        font: bold,
      });
  });
  offset += cellHeight * 5 + 30;
  text(
    copy.probability,
    10,
    true,
    (width - bold.widthOfTextAtSize(copy.probability, 10)) / 2,
    width,
    0,
  );
  const pHelp = copy.probabilityHelp + " · " + copy.scale;
  text(
    pHelp,
    9,
    false,
    (width - font.widthOfTextAtSize(pHelp, 9)) / 2,
    width,
    10,
  );
  const legendTop = offset,
    cardWidth = (width - 18) / 4;
  operations.push((page, top) =>
    riskMapLevels.forEach((level, index) => {
      const x = left + index * (cardWidth + 6),
        y = top - legendTop - 43;
      page.drawRectangle({
        x,
        y,
        width: cardWidth,
        height: 43,
        color: rgb(
          riskMapColors[level][0],
          riskMapColors[level][1],
          riskMapColors[level][2],
        ),
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.5,
      });
      page.drawText(
        `${riskMapNames[locale][level]}: ${summary.counts[level]}`,
        { x: x + 7, y: y + 28, font: bold, size: 10 },
      );
      page.drawText(locale === "es" ? "evaluaciones" : "assessments", {
        x: x + 7,
        y: y + 17,
        font,
        size: 8,
      });
      page.drawText(`${copy.range} ${riskMapRanges[level]}`, {
        x: x + 7,
        y: y + 6,
        font,
        size: 8,
      });
    }),
  );
  offset += 57;
  text(`${copy.pending}: ${summary.pending.length}`, 9, true);
  text(copy.formula, 9);
  text(copy.markers, 9);
  text(copy.scope, 9);
  return {
    height: offset,
    draw(page: PDFPage, top: number) {
      operations.forEach((paint) => paint(page, top));
      return top - offset;
    },
  };
}
