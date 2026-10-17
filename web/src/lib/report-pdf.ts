import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { reportTables, type ReportExport } from "./report-export";

export async function reportPdf(report: ReportExport) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const folder = path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans/files",
  );
  const regular = await pdf.embedFont(
    await readFile(path.join(folder, "noto-sans-latin-400-normal.woff")),
    { subset: true },
  );
  const bold = await pdf.embedFont(
    await readFile(path.join(folder, "noto-sans-latin-700-normal.woff")),
    { subset: true },
  );
  pdf.setTitle(`Galápagos Life Fund - ${report.title}`);
  pdf.setAuthor("Galápagos Life Fund");
  pdf.setCreationDate(new Date(report.summary.cutoff));
  const es = report.locale === "es";
  const navy = rgb(0.12, 0.23, 0.39),
    muted = rgb(0.34, 0.41, 0.48),
    pale = rgb(0.95, 0.97, 0.98);
  let page = pdf.addPage([595.28, 841.89]),
    y = 790;
  function wrap(value: string, width: number, size: number, font = regular) {
    const lines: string[] = [];
    let line = "";
    for (const word of value.replace(/[\u0000-\u001f]/g, " ").split(/\s+/)) {
      if (!word) continue;
      const candidate = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const char of word) {
        if (line && font.widthOfTextAtSize(line + char, size) > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function text(value: string, size = 10, strong = false, width = 491) {
    const font = strong ? bold : regular;
    wrap(value, width, size, font).forEach(draw);
    function draw(line: string) {
      if (y < 65) {
        page = pdf.addPage([595.28, 841.89]);
        y = 790;
      }
      page.drawText(line.trim(), {
        x: 52,
        y,
        size,
        font,
        color: strong ? navy : muted,
      });
      y -= size + 6;
    }
  }
  const tables = reportTables(report);
  text("GALÁPAGOS LIFE FUND", 11, true);
  text(es ? "Reportería de cierre" : "Closing report", 20, true);
  y -= 8;
  text(report.title, 12, true);
  text(report.code);
  text(
    `${es ? "Fecha y hora de corte (Galápagos)" : "Cut-off date and time (Galapagos)"}: ${tables.summary[3][1]}`,
  );
  y -= 16;
  function section(title: string) {
    if (y < 110) {
      page = pdf.addPage([595.28, 841.89]);
      y = 790;
    }
    text(title, 12, true);
    y -= 5;
  }
  function row(label: string, value: string) {
    if (y < 85) {
      page = pdf.addPage([595.28, 841.89]);
      y = 790;
    }
    const labelLines = wrap(label, 350, 10);
    const height = Math.max(30, labelLines.length * 16 + 12);
    if (y - height < 60) {
      page = pdf.addPage([595.28, 841.89]);
      y = 790;
    }
    page.drawRectangle({
      x: 48,
      y: y - height + 8,
      width: 499,
      height,
      color: pale,
    });
    labelLines.forEach((l, i) =>
      page.drawText(l.trim(), {
        x: 58,
        y: y - i * 16 - 7,
        size: 10,
        font: regular,
        color: navy,
      }),
    );
    page.drawText(value, {
      x: 535 - bold.widthOfTextAtSize(value, 10),
      y: y - 7,
      size: 10,
      font: bold,
      color: navy,
    });
    y -= height + 3;
  }
  section(es ? "Estado de las postulaciones" : "Application status");
  tables.summary
    .slice(4, 10)
    .forEach(([label, value]) =>
      row(String(label), Number(value).toLocaleString(report.locale)),
    );
  y -= 12;
  section(es ? "Montos (USD)" : "Amounts (USD)");
  tables.summary
    .slice(10)
    .forEach(([label, value]) =>
      row(
        String(label),
        Number(value).toLocaleString(report.locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ),
    );
  y -= 12;
  section(
    es
      ? "Distribución por tema de aplicación"
      : "Distribution by application topic",
  );
  if (tables.themes.length === 1)
    text(es ? "No hay postulaciones recibidas." : "No received applications.");
  tables.themes
    .slice(1)
    .forEach(([label, value]) => row(String(label), String(value)));
  y -= 15;
  text(
    es
      ? "Selección, aprobación y convenio firmado son hitos distintos. Este reporte no acredita ejecución ni impactos alcanzados."
      : "Selection, approval and signed agreements are distinct milestones. This report does not certify implementation or achieved impacts.",
    9,
  );
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(`${report.code} | ${i + 1} / ${pages.length}`, {
      x: 52,
      y: 30,
      size: 8,
      font: regular,
      color: muted,
    }),
  );
  return pdf.save();
}
