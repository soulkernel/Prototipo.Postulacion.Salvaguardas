import { zipSync, strToU8 } from "fflate";
import type { Locale } from "./domain";
// Inline string cells prevent spreadsheet formula injection from applicant text.
const xml = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
export function summaryWorkbook(
  records: Record<string, unknown[]>,
  locale: Locale,
) {
  type Row = Record<string, unknown>;
  const apps = (records.applications || []) as Row[];
  const versions = (records.application_versions || []) as {
    application_id: string;
    revision: number;
    payload: { concept: Record<string, unknown> };
  }[];
  const calls = (records.calls || []) as Row[];
  const es = locale === "es";
  const rows: unknown[][] = [
    [
      es ? "Referencia" : "Reference",
      es ? "Convocatoria" : "Call",
      es ? "Proyecto" : "Project",
      es ? "Categoría" : "Category",
      es ? "Proponente" : "Applicant",
      es ? "Responsable" : "Contact",
      es ? "Correo" : "Email",
      es ? "Teléfono" : "Phone",
      es ? "Monto solicitado" : "Requested amount",
      es ? "Cofinanciamiento" : "Co-financing",
      es ? "Estado" : "Status",
      es ? "Fecha de envío" : "Submitted at",
    ],
  ];
  for (const app of apps) {
    const c =
      versions
        .filter((v) => v.application_id === app.id)
        .sort((a, b) => b.revision - a.revision)[0]?.payload?.concept || {};
    const call = calls.find((c) => c.id === app.call_id);
    rows.push([
      app.reference_code,
      call?.[es ? "title_es" : "title_en"],
      c.title,
      c.category_id,
      c.applicant_name,
      c.contact_name,
      c.email,
      c.phone,
      c.requested_amount,
      c.cofinance_amount,
      app.status,
      app.submitted_at,
    ]);
  }
  const sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${r.map((v, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`).join("")}</row>`).join("")}</sheetData><autoFilter ref="A1:L${rows.length}"/></worksheet>`;
  const files = {
    "[Content_Types].xml":
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml":
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Expedientes" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": sheet,
  };
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])),
  );
}
