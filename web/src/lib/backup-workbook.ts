import { zipSync, strToU8 } from "fflate";
import type { Locale } from "./domain";
import { statusLabel } from "./fields";

type Row = Record<string, unknown>;
type Cell = string | number;
const obj = (v: unknown): Row =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {};
const list = (v: unknown): Row[] => (Array.isArray(v) ? v.map(obj) : []);
const xml = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const column = (index: number): string => {
  let n = index + 1,
    s = "";
  while (n) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
};
const number = (v: unknown): number | undefined =>
  v !== null && v !== "" && v !== undefined && Number.isFinite(Number(v))
    ? Number(v)
    : undefined;
const day = (v: unknown): number | undefined => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const n = Date.parse(v + "T00:00:00Z");
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === v
    ? n
    : undefined;
};
const serial = (n: number) => n / 86400000 + 25569;

export function summaryWorkbook(
  records: Record<string, unknown[]>,
  locale: Locale,
) {
  const es = locale === "es",
    missing = es ? "No registrado" : "Not recorded";
  const t = (a: string, b: string) => (es ? a : b);
  const value = (v: unknown): Cell =>
    v === undefined || v === null || v === ""
      ? missing
      : typeof v === "number"
        ? v
        : String(v);
  const date = (v: unknown): Cell =>
    day(v) === undefined ? missing : serial(day(v)!);
  // Stored timestamps are displayed in Galapagos, never in the operator's timezone.
  const timestamp = (v: unknown): Cell =>
    typeof v === "string" && Number.isFinite(Date.parse(v))
      ? new Intl.DateTimeFormat(es ? "es-EC" : "en-GB", {
          timeZone: "Pacific/Galapagos",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(v))
      : missing;
  const headers = [
    t("Referencia", "Reference"),
    t("Convocatoria", "Call"),
    t("Proyecto", "Project"),
    t("Categoría de subvención", "Grant category"),
    t("Tipo de proyecto", "Project type"),
    t("Estado", "Status"),
    t("Tipo de solicitante", "Applicant type"),
    t("Proponente", "Applicant"),
    t("Responsable / persona de contacto", "Contact person"),
    t("Correo", "Email"),
    t("Teléfono", "Phone"),
    t("Provincia", "Province"),
    t("Ciudad", "City"),
    t("Dirección", "Address"),
    t("Islas de intervención", "Project islands"),
    t("Ubicación y ámbito", "Location and scope"),
    t("Organizaciones asociadas", "Partner organizations"),
    t("Inicio propuesto", "Proposed start"),
    t("Finalización propuesta", "Proposed end"),
    t(
      "Duración propuesta (días transcurridos)",
      "Proposed duration (elapsed days)",
    ),
    t("Máximo permitido por categoría (meses)", "Category maximum (months)"),
    t("Monto solicitado GLF (USD)", "Requested GLF amount (USD)"),
    t("Cofinanciamiento (USD)", "Co-financing (USD)"),
    t("Costo total estimado (USD)", "Estimated total cost (USD)"),
    t("Gastos administrativos (USD)", "Administrative costs (USD)"),
    t(
      "Cofinanciamiento / monto solicitado (%)",
      "Co-financing / requested amount (%)",
    ),
    t("Fase actual", "Current phase"),
    t(
      "Última presentación (hora Galápagos)",
      "Latest submission (Galapagos time)",
    ),
    t("Versión presentada", "Submitted revision"),
    t(
      "Plazo propuesta completa (hora Galápagos)",
      "Full proposal deadline (Galapagos time)",
    ),
    t("Última decisión", "Latest decision"),
    t("Fecha decisión (hora Galápagos)", "Decision date (Galapagos time)"),
    t("Monto aprobado (USD)", "Approved amount (USD)"),
    t("Referencia convenio", "Agreement reference"),
    t("Firma GLF", "GLF signed on"),
    t("Firma postulante", "Applicant signed on"),
  ];
  const main: Cell[][] = [headers];
  const results: Cell[][] = [
    [
      t("Referencia", "Reference"),
      t("Proyecto", "Project"),
      t("Objetivo asociado", "Linked objective"),
      t("Resultado esperado", "Expected result"),
      t("Indicador", "Indicator"),
      t("Meta", "Target"),
      t("Unidad", "Unit"),
      t("Evidencia prevista", "Expected evidence"),
    ],
  ];
  const risks: Cell[][] = [
    [
      t("Referencia", "Reference"),
      t("Proyecto", "Project"),
      t("Actividad", "Activity"),
      t("Tipo de riesgo", "Risk type"),
      t("Riesgo", "Risk"),
      t("Descripción", "Description"),
      t("Probabilidad", "Probability"),
      t("Gravedad", "Severity"),
      t("Puntaje", "Score"),
      t("Nivel de riesgo", "Risk level"),
    ],
  ];
  const apps = list(records.applications),
    versions = list(records.application_versions),
    calls = list(records.calls);
  const decisions = {
    recommend: t("Recomendar", "Recommend"),
    invite: t("Invitar a propuesta completa", "Invite full proposal"),
    not_select: t("No seleccionar", "Not selected"),
    approve: t("Aprobar", "Approve"),
    reject: t("Rechazar", "Reject"),
  };
  const units: Record<string, string> = {
    people: t("Personas", "People"),
    activities: t("Actividades", "Activities"),
    products: t("Productos", "Products"),
    sites: t("Sitios", "Sites"),
    hectares: t("Hectáreas", "Hectares"),
    percent: t("Porcentaje", "Percentage"),
  };
  for (const app of apps) {
    const version =
      versions
        .filter((v) => v.application_id === app.id)
        .sort(
          (a, b) => (number(b.revision) || 0) - (number(a.revision) || 0),
        )[0] || {};
    const payload = obj(version.payload),
      c = obj(payload.concept),
      call = calls.find((c) => c.id === app.call_id) || {};
    const snapshot = obj(version.rules_snapshot || app.rules_snapshot),
      category =
        list(snapshot.categories || obj(call.rules).categories).find(
          (k) => k.id === c.category_id,
        ) || {};
    const agreement =
      list(records.project_agreements).find(
        (g) => g.application_id === app.id,
      ) || {};
    const ds = list(records.governance_decisions)
      .filter((d) => d.application_id === app.id)
      .sort(
        (a, b) =>
          String(b.created_at).localeCompare(String(a.created_at)) ||
          String(b.id).localeCompare(String(a.id)),
      );
    const decision = ds[0] || {},
      approval = ds.find((d) => d.decision === "approve") || {};
    const requested = number(c.requested_amount),
      cofinance = number(c.cofinance_amount),
      start = day(c.start_date),
      end = day(c.end_date);
    const title = value(c.title),
      ref = value(app.reference_code);
    main.push([
      ref,
      value(call[es ? "title_es" : "title_en"]),
      title,
      value(category[es ? "label_es" : "label_en"] || c.category_id),
      value(c.project_type),
      statusLabel(String(app.status || ""), locale),
      value(c.applicant_type),
      value(c.applicant_name),
      value(c.contact_name),
      value(c.email),
      value(c.phone),
      value(c.province),
      value(c.city),
      value(c.address),
      value(
        [
          ...(Array.isArray(c.project_islands) ? c.project_islands : []),
          c.other_islands,
        ]
          .filter(Boolean)
          .join("; "),
      ),
      value(c.location),
      value(
        Array.isArray(c.associated_organizations)
          ? c.associated_organizations.join("; ")
          : c.partners,
      ),
      date(c.start_date),
      date(c.end_date),
      start !== undefined && end !== undefined && end >= start
        ? (end - start) / 86400000
        : missing,
      value(number(category.max_months)),
      value(requested),
      value(cofinance),
      requested !== undefined && cofinance !== undefined
        ? requested + cofinance
        : missing,
      value(number(c.admin_cost)),
      requested !== undefined && requested > 0 && cofinance !== undefined
        ? cofinance / requested
        : missing,
      Number(app.stage) === 2
        ? t("Fase 2: propuesta completa", "Phase 2: full proposal")
        : t("Fase 1: nota conceptual", "Phase 1: concept note"),
      timestamp(version.submitted_at || version.created_at || app.submitted_at),
      value(version.revision),
      timestamp(app.phase2_deadline),
      value(
        decisions[String(decision.decision) as keyof typeof decisions] ||
          decision.decision,
      ),
      timestamp(decision.created_at),
      value(
        number(agreement.approved_amount) ?? number(approval.approved_amount),
      ),
      value(agreement.reference),
      date(agreement.glf_signed_on),
      date(agreement.applicant_signed_on),
    ]);
    const objectives = list(obj(c.strategic_alignment).objectives);
    for (const r of list(c.project_results))
      results.push([
        ref,
        title,
        value(objectives.find((o) => o.id === r.objective_id)?.text),
        value(r.result),
        value(r.indicator),
        value(number(r.target)),
        value(
          r.unit === "other" ? r.other_unit : units[String(r.unit)] || r.unit,
        ),
        value(r.evidence),
      ]);
    if (!Array.isArray(c.project_results) && c.results)
      results.push([
        ref,
        title,
        missing,
        value(c.results),
        missing,
        missing,
        missing,
        missing,
      ]);
    for (const a of list(payload.activities))
      for (const r of list(a.risks)) {
        const p = number(r.probability),
          s = number(r.severity),
          score = p !== undefined && s !== undefined ? p * s : undefined;
        risks.push([
          ref,
          title,
          value(a.title),
          r.dimension === "environmental"
            ? t("Ambiental", "Environmental")
            : r.dimension === "social"
              ? t("Social", "Social")
              : missing,
          value(r.name),
          value(r.description),
          value(p),
          value(s),
          value(score),
          score === undefined
            ? missing
            : score <= 4
              ? t("Bajo", "Low")
              : score <= 9
                ? t("Medio", "Medium")
                : score <= 15
                  ? t("Alto", "High")
                  : t("Muy alto", "Very high"),
        ]);
      }
  }
  const sheets = [
    { name: t("Expedientes", "Applications"), rows: main },
    {
      name: t("Resultados e indicadores", "Results and indicators"),
      rows: results,
    },
    { name: t("Riesgos identificados", "Identified risks"), rows: risks },
  ];
  const files: Record<string, string> = {
    "[Content_Types].xml": `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml":
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00&quot; USD&quot;"/><numFmt numFmtId="166" formatCode="0.00%"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF203B63"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
  };
  sheets.forEach((sheet, index) => {
    const cols = sheet.rows[0].length,
      last = column(cols - 1);
    files[`xl/worksheets/sheet${index + 1}.xml`] =
      `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}${sheet.rows.length}"/><sheetViews><sheetView workbookViewId="0"><pane xSplit="2" ySplit="1" topLeftCell="C2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><cols>${sheet.rows[0].map((_, j) => `<col min="${j + 1}" max="${j + 1}" width="${j === 2 ? 45 : 25}" customWidth="1"/>`).join("")}</cols><sheetData>${sheet.rows
        .map(
          (r, i) =>
            `<row r="${i + 1}"${i === 0 ? ' ht="44" customHeight="1"' : ""}>${r
              .map((v, j) => {
                const style =
                  i === 0
                    ? 1
                    : index === 0 &&
                        [17, 18, 34, 35].includes(j) &&
                        typeof v === "number"
                      ? 2
                      : index === 0 &&
                          [21, 22, 23, 24, 32].includes(j) &&
                          typeof v === "number"
                        ? 3
                        : index === 0 && j === 25 && typeof v === "number"
                          ? 4
                          : 0;
                return typeof v === "number"
                  ? `<c r="${column(j)}${i + 1}" s="${style}"><v>${v}</v></c>`
                  : `<c r="${column(j)}${i + 1}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
              })
              .join("")}</row>`,
        )
        .join(
          "",
        )}</sheetData><autoFilter ref="A1:${last}${sheet.rows.length}"/></worksheet>`;
  });
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])),
  );
}
