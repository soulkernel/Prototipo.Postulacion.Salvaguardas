import { zipSync, strToU8 } from "fflate";
import { csvCell } from "./files";
import { callThemeLabel } from "./call-themes";
import { statusLabel } from "./fields";
import type { Locale } from "./domain";

export type ReportSummary = {
  cutoff: string;
  received: number;
  invited: number;
  phase2_received: number;
  approved: number;
  signed: number;
  not_selected: number;
  requested_total: number;
  approved_total: number;
  signed_total: number;
  by_type: { project_type: string; received: number }[];
};
export type ReportApplication = {
  id: string;
  reference_code: string;
  status: string;
  stage: number;
  submitted_at: string;
  concept: Record<string, unknown>;
};
export type ReportExport = {
  code: string;
  title: string;
  summary: ReportSummary;
  applications: ReportApplication[];
  rules: unknown;
  locale: Locale;
};
type Cell = string | number;
export function reportTables(report: ReportExport) {
  const { summary: s, locale, rules } = report;
  const t = (es: string, en: string) => (locale === "es" ? es : en);
  const date = (v: unknown) =>
    v
      ? new Date(String(v)).toLocaleString(locale, {
          timeZone: "Pacific/Galapagos",
        })
      : "";
  const numeric = (v: unknown): Cell =>
    v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v))
      ? Number(v)
      : "";
  const categories =
    (
      rules as {
        categories?: { id: string; label_es: string; label_en: string }[];
      }
    )?.categories || [];
  const summary: Cell[][] = [
    [t("Indicador", "Indicator"), t("Valor", "Value")],
    [t("Convocatoria", "Call"), report.title],
    [t("Código", "Code"), report.code],
    [
      t(
        "Fecha y hora de corte (Galápagos)",
        "Cut-off date and time (Galapagos)",
      ),
      date(s.cutoff),
    ],
    [t("Postulaciones recibidas", "Received applications"), s.received],
    [t("Invitadas a fase 2", "Invited to phase 2"), s.invited],
    [
      t("Proyectos completos recibidos", "Full proposals received"),
      s.phase2_received,
    ],
    [t("Aprobadas", "Approved"), s.approved],
    [t("Convenios firmados", "Signed agreements"), s.signed],
    [t("No seleccionadas", "Not selected"), s.not_selected],
    [
      t("Monto solicitado (USD)", "Requested amount (USD)"),
      Number(s.requested_total),
    ],
    [
      t("Monto aprobado (USD)", "Approved amount (USD)"),
      Number(s.approved_total),
    ],
    [
      t(
        "Monto con convenio firmado (USD)",
        "Amount under signed agreements (USD)",
      ),
      Number(s.signed_total),
    ],
  ];
  const detail: Cell[][] = [
    [
      t("Convocatoria", "Call"),
      t("Código convocatoria", "Call code"),
      t("Corte (hora Galápagos)", "Cut-off (Galapagos time)"),
      t("Referencia", "Reference"),
      t("Proyecto", "Project"),
      t("Organización o proponente", "Organization or applicant"),
      t("Persona de contacto", "Contact person"),
      t("Correo electrónico", "Email"),
      t("Teléfono", "Phone"),
      t("Categoría", "Category"),
      t("Línea temática", "Thematic line"),
      t("Etapa de la última presentación", "Latest submission stage"),
      t("Estado", "Status"),
      t("Monto solicitado (USD)", "Requested amount (USD)"),
      t("Cofinanciamiento (USD)", "Co-financing (USD)"),
      t("Fecha de inicio del proyecto", "Project start date"),
      t("Fecha de finalización del proyecto", "Project end date"),
      t("Último envío (hora Galápagos)", "Latest submission (Galapagos time)"),
      t(
        "Credencial de residencia permanente / RUC",
        "Permanent residence card / RUC",
      ),
    ],
    ...report.applications.map((a) => {
      const c = a.concept;
      const category = categories.find((k) => k.id === c.category_id);
      return [
        report.title,
        report.code,
        date(s.cutoff),
        a.reference_code,
        String(c.title || ""),
        String(c.applicant_name || ""),
        String(c.contact_name || ""),
        String(c.email || ""),
        String(c.phone || ""),
        category
          ? locale === "es"
            ? category.label_es
            : category.label_en
          : String(c.category_id || ""),
        callThemeLabel(String(c.project_type || ""), rules, locale),
        a.stage === 1
          ? t("Nota conceptual", "Concept note")
          : t("Proyecto completo", "Full proposal"),
        statusLabel(a.status, locale),
        numeric(c.requested_amount),
        numeric(c.cofinance_amount),
        String(c.start_date || ""),
        String(c.end_date || ""),
        date(a.submitted_at),
        String(
          c.applicant_type === "individual"
            ? c.residence_number || ""
            : c.applicant_type === "organization"
              ? c.ruc || ""
              : "",
        ),
      ];
    }),
  ];
  const themes: Cell[][] = [
    [
      t("Línea temática", "Thematic line"),
      t("Postulaciones recibidas", "Received applications"),
    ],
    ...s.by_type.map((r) => [
      callThemeLabel(r.project_type, rules, locale),
      r.received,
    ]),
  ];
  return { summary, detail, themes };
}
export function reportCsv(report: ReportExport) {
  return (
    "\uFEFF" +
    reportTables(report)
      .detail.map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
const xml = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const column = (n: number) => {
  let s = "";
  for (n++; n; n = Math.floor((n - 1) / 26))
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};
export function reportWorkbook(report: ReportExport) {
  const tables = reportTables(report);
  const names =
    report.locale === "es"
      ? ["Resumen", "Expedientes", "Distribución temática"]
      : ["Summary", "Applications", "Thematic distribution"];
  const sheets = [tables.summary, tables.detail, tables.themes];
  const files: Record<string, string> = {
    "[Content_Types].xml": `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml":
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00&quot; USD&quot;"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF203B63"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
  };
  sheets.forEach((rows, index) => {
    const last = column(rows[0].length - 1);
    files[`xl/worksheets/sheet${index + 1}.xml`] =
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}${rows.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${rows[0].map((_, j) => `<col min="${j + 1}" max="${j + 1}" width="${index === 1 ? ([0, 4, 5, 10].includes(j) ? 45 : 25) : j === 0 ? 52 : 35}" customWidth="1"/>`).join("")}</cols><sheetData>${rows
        .map(
          (r, i) =>
            `<row r="${i + 1}" ht="${i === 0 ? 44 : index === 1 ? 60 : 32}" customHeight="1">${r
              .map((v, j) => {
                const money =
                  (index === 0 && i >= 10) ||
                  (index === 1 && [13, 14].includes(j));
                const style =
                  i === 0 ? 1 : money && typeof v === "number" ? 2 : 0;
                return typeof v === "number"
                  ? `<c r="${column(j)}${i + 1}" s="${style}"><v>${v}</v></c>`
                  : `<c r="${column(j)}${i + 1}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
              })
              .join("")}</row>`,
        )
        .join(
          "",
        )}</sheetData><autoFilter ref="A1:${last}${rows.length}"/></worksheet>`;
  });
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])),
  );
}
