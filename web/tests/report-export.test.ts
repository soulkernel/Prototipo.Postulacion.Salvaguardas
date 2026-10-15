import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import { PDFDocument } from "pdf-lib";
import {
  reportTables,
  reportWorkbook,
  reportCsv,
  type ReportExport,
} from "../src/lib/report-export";
import { reportPdf } from "../src/lib/report-pdf";

const fixture: ReportExport = {
  code: "GLF-2026-01",
  title: "Convocatoria de subvenciones GLF",
  locale: "es",
  rules: { categories: [] },
  summary: {
    cutoff: "2026-10-14T02:30:00Z",
    received: 3,
    invited: 2,
    phase2_received: 1,
    approved: 1,
    signed: 0,
    not_selected: 0,
    requested_total: 210000,
    approved_total: 60000,
    signed_total: 0,
    by_type: [
      { project_type: "Educación y conservación marina", received: 2 },
      {
        project_type: "Economía azul y participación comunitaria",
        received: 1,
      },
    ],
  },
  applications: [1, 2, 3].map((i) => ({
    id: String(i),
    reference_code: `GLF-${i}`,
    status: "submitted",
    stage: 1,
    submitted_at: "2026-10-13T15:00:00Z",
    concept: {
      title: i === 1 ? '=HYPERLINK("test")' : `Conservación marina ${i}`,
      contact_name: "Responsable",
      email: "contacto@example.org",
      phone: "+593991234567",
      requested_amount: 70000,
      cofinance_amount: null,
      start_date: "2027-01-01",
      end_date: "2027-12-31",
    },
  })),
};

test("internal exports preserve conditional identification as text and distinguish historical missing values", () => {
  const report = structuredClone(fixture);
  Object.assign(report.applications[0].concept, {
    applicant_type: "individual",
    residence_number: "RP-00123",
    ruc: "2099999999999",
  });
  Object.assign(report.applications[1].concept, {
    applicant_type: "organization",
    ruc: "2090000000001",
    residence_number: "INACTIVE",
  });
  const rows = reportTables(report).detail;
  const column = rows[0].indexOf("Credencial de residencia permanente / RUC");
  assert.equal(rows[1][column], "RP-00123");
  assert.equal(rows[2][column], "2090000000001");
  assert.equal(rows[3][column], "");
  assert.ok(rows[0].includes("Fecha de inicio del proyecto"));
  for (const row of rows) assert.equal(row.length, rows[0].length);
  const csv = reportCsv(report);
  assert.match(csv, /RP-00123/);
  assert.doesNotMatch(csv, /INACTIVE|2099999999999/);
  const sheet = strFromU8(
    unzipSync(reportWorkbook(report))["xl/worksheets/sheet2.xml"],
  );
  assert.match(sheet, /t="inlineStr"><is><t[^>]*>2090000000001/);
});
test("closing workbook keeps three applications, numeric amounts, safe text and separate summary/theme sheets", () => {
  const files = unzipSync(reportWorkbook(fixture));
  const book = strFromU8(files["xl/workbook.xml"]);
  assert.equal((book.match(/<sheet /g) || []).length, 3);
  const detail = strFromU8(files["xl/worksheets/sheet2.xml"]);
  assert.equal((detail.match(/<row /g) || []).length, 4);
  assert.ok(detail.includes('<c r="N2" s="2"><v>70000</v></c>'));
  assert.ok(detail.includes("=HYPERLINK(&quot;test&quot;)"));
  assert.ok(!detail.includes("<f>"));
  const tables = reportTables(fixture);
  assert.equal(tables.detail[1][14], ""); // Missing finance must not become zero.
  assert.equal(tables.detail[1][12], "Recibida");
  assert.ok(String(tables.summary[3][1]).includes("20:30"));
});
test("statistical CSV is rectangular, has one row per application and neutralizes formulas", () => {
  const csv = reportCsv(fixture);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.equal(csv.split("\r\n").length, 4);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.equal(reportTables({ ...fixture, applications: [] }).detail.length, 1);
  assert.equal(
    reportTables({ ...fixture, locale: "en" }).detail[0][3],
    "Reference",
  );
});
test("executive PDF embeds fonts and paginates long titles and thematic distributions", async () => {
  const bytes = await reportPdf(fixture);
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
  const long = await reportPdf({
    ...fixture,
    title: "Conservación comunitaria ".repeat(45),
    summary: {
      ...fixture.summary,
      by_type: Array.from({ length: 40 }, (_, i) => ({
        project_type:
          `Línea estratégica ${i}: ` +
          "Conservación marina y educación ".repeat(5),
        received: i,
      })),
    },
  });
  assert.ok((await PDFDocument.load(long)).getPageCount() > 2);
  if (process.env.GLF_REPORT_QA_DIR) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const out = process.env.GLF_REPORT_QA_DIR;
    await mkdir(out, { recursive: true });
    await writeFile(out + "/reporte.pdf", bytes);
    await writeFile(out + "/reporte-largo.pdf", long);
    await writeFile(out + "/reporte.xlsx", reportWorkbook(fixture));
  }
});
