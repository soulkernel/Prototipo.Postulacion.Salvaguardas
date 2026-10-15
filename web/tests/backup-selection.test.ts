import { test } from "node:test";
import assert from "node:assert/strict";
import { backupSelectionSchema } from "../src/lib/backup-selection";
import { defaultCall, resolveFilters } from "../src/lib/inbox-filters";
import { summaryWorkbook } from "../src/lib/backup-workbook";
import { unzipSync, strFromU8 } from "fflate";
import type { Call } from "../src/lib/domain";
const id = "7f3af678-2728-41d5-8ff6-bfb5fa1395cf";
test("filters default to newest open published call and preserve explicit all", () => {
  const call = (
    id: string,
    status: string,
    opens_at: string,
    closes_at: string,
  ) =>
    ({
      id,
      status,
      opens_at,
      closes_at,
      rules: { categories: [] },
    }) as unknown as Call;
  const calls = [
    call("old", "published", "2026-01-01", "2026-12-31"),
    call("new", "published", "2026-09-01", "2026-12-31"),
    call("draft", "draft", "2026-10-01", "2026-12-31"),
  ];
  assert.equal(defaultCall(calls, Date.parse("2026-10-11")), "new");
  assert.equal(resolveFilters(calls, { call: "all" }, "es").call, "all");
  assert.equal(defaultCall([], 0), "all");
  assert.equal(defaultCall(calls, Date.parse("2027-01-01")), "new");
});
test("backup Excel escapes applicant text and uses latest submitted version", () => {
  const bytes = summaryWorkbook(
    {
      applications: [{ id, reference_code: "REF", call_id: "c" }],
      application_versions: [
        {
          application_id: id,
          revision: 1,
          payload: { concept: { title: "old" } },
        },
        {
          application_id: id,
          revision: 2,
          payload: {
            concept: {
              title: "=1+1 & <test>",
              email: "a@b.ec",
              phone: "+593999999999",
            },
          },
        },
      ],
    },
    "es",
  );
  const sheet = strFromU8(unzipSync(bytes)["xl/worksheets/sheet1.xml"]);
  assert.ok(sheet.includes("=1+1 &amp; &lt;test&gt;"));
  assert.ok(sheet.includes("a@b.ec"));
  assert.ok(!sheet.includes("<f>"));
  assert.ok(!sheet.includes(">old<"));
});
test("backup scope never broadens an empty or conflicting selection", () => {
  for (const selection of [
    {},
    { scope: "selected", applications: [] },
    { scope: "call", call: "" },
    { scope: "all", applications: [id] },
    { scope: "selected", applications: [id, id] },
    { scope: "selected", applications: ["invalid"] },
    { scope: "call", call: id, applications: [id] },
  ])
    assert.equal(backupSelectionSchema.safeParse(selection).success, false);
  assert.equal(backupSelectionSchema.safeParse({ scope: "all" }).success, true);
  assert.equal(
    backupSelectionSchema.safeParse({ scope: "call", call: id }).success,
    true,
  );
  assert.equal(
    backupSelectionSchema.safeParse({ scope: "selected", applications: [id] })
      .success,
    true,
  );
});

test("Excel exports exactly three distinct applications plus header without collapsing records", () => {
  const applications = [1, 2, 3].map((n) => ({
    id: String(n),
    reference_code: `REF-${n}`,
    call_id: "c",
  }));
  const application_versions = applications.map((a) => ({
    application_id: a.id,
    revision: 1,
    payload: { concept: { title: `Project ${a.id}` } },
  }));
  const sheet = strFromU8(
    unzipSync(summaryWorkbook({ applications, application_versions }, "es"))[
      "xl/worksheets/sheet1.xml"
    ],
  );
  assert.equal((sheet.match(/<row r=/g) || []).length, 4);
  for (const a of applications) assert.ok(sheet.includes(a.reference_code));
});

test("expanded workbook separates proposed dates, numeric amounts, results and scored risks", () => {
  const records = {
    applications: [
      {
        id: "x",
        reference_code: "R-X",
        call_id: "c",
        status: "submitted",
        stage: 1,
      },
    ],
    application_versions: [
      {
        application_id: "x",
        revision: 2,
        submitted_at: "2026-10-12T02:00:00Z",
        rules_snapshot: {
          categories: [{ id: "small", label_es: "Pequeña", max_months: 12 }],
        },
        payload: {
          concept: {
            title: "Proyecto",
            category_id: "small",
            start_date: "2026-01-01",
            end_date: "2026-02-01",
            requested_amount: 100,
            cofinance_amount: 0,
            admin_cost: 10,
            strategic_alignment: {
              objectives: [{ id: "o", text: "Objetivo marino" }],
            },
            project_results: [
              {
                objective_id: "o",
                result: "Resultado",
                indicator: "Participantes",
                target: 0,
                unit: "people",
                evidence: "Lista",
              },
            ],
          },
          activities: [
            {
              title: "Taller",
              risks: [
                {
                  name: "Riesgo",
                  dimension: "social",
                  probability: 2,
                  severity: 3,
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const files = unzipSync(summaryWorkbook(records, "es")),
    main = strFromU8(files["xl/worksheets/sheet1.xml"]),
    results = strFromU8(files["xl/worksheets/sheet2.xml"]),
    risks = strFromU8(files["xl/worksheets/sheet3.xml"]);
  assert.ok(main.includes('ref="A1:AK2"'));
  assert.ok(main.includes('r="T2" s="0"><v>31</v>'));
  assert.ok(main.includes('r="V2" s="3"><v>100</v>'));
  assert.ok(main.includes('r="Z2" s="4"><v>0</v>'));
  assert.ok(main.includes("11/10/2026"));
  assert.ok(main.includes("No registrado"));
  assert.ok(results.includes("Objetivo marino"));
  assert.ok(results.includes('r="F2" s="0"><v>0</v>'));
  assert.ok(risks.includes('r="I2" s="0"><v>6</v>'));
  assert.ok(risks.includes("Medio"));
  assert.ok(
    strFromU8(files["xl/workbook.xml"]).includes("Resultados e indicadores"),
  );
});

test("backup identification comes from the frozen submission, never from the next-phase draft", () => {
  const records = {
    applications: [
      {
        id: "x",
        reference_code: "REF-X",
        payload: {
          concept: { applicant_type: "organization", ruc: "2099999999999" },
        },
        status: "phase2_draft",
        stage: 2,
      },
    ],
    application_versions: [
      {
        application_id: "x",
        revision: 2,
        stage: 1,
        payload: {
          concept: {
            applicant_type: "individual",
            residence_number: "RP-00123",
          },
        },
      },
    ],
  };
  const sheet = strFromU8(
    unzipSync(summaryWorkbook(records, "es"))["xl/worksheets/sheet1.xml"],
  );
  assert.match(sheet, /RP-00123/);
  assert.doesNotMatch(sheet, /2099999999999/);
  assert.match(sheet, /Fecha de inicio del proyecto/);
});

test("risk summary uses maxima by dimension, never adds initial and residual or treats missing as zero", () => {
  const risk = (
    dimension: string,
    p: number | null,
    g: number | null,
    rp: number | null,
    rg: number | null,
  ) => ({
    dimension,
    probability: p,
    severity: g,
    residual_probability: rp,
    residual_severity: rg,
  });
  const make = (stage: number, rows: unknown[]) =>
    strFromU8(
      unzipSync(
        summaryWorkbook(
          {
            applications: [{ id: "x", stage }],
            application_versions: [
              {
                application_id: "x",
                revision: 1,
                stage,
                payload: { concept: {}, activities: [{ risks: rows }] },
              },
            ],
          },
          "es",
        ),
      )["xl/worksheets/sheet1.xml"],
    );
  const row = make(2, [
    risk("environmental", 2, 3, 1, 2),
    risk("environmental", 5, 4, 2, 3),
    risk("social", 3, 3, 1, 1),
  ]);
  assert.ok(
    row.includes(
      'r="AG2" s="0" t="inlineStr"><is><t xml:space="preserve">20 · Muy alto',
    ),
  );
  assert.ok(
    row.includes(
      'r="AH2" s="0" t="inlineStr"><is><t xml:space="preserve">9 · Medio',
    ),
  );
  assert.ok(
    row.includes(
      'r="AI2" s="0" t="inlineStr"><is><t xml:space="preserve">6 · Medio',
    ),
  );
  assert.ok(
    row.includes(
      'r="AJ2" s="0" t="inlineStr"><is><t xml:space="preserve">1 · Bajo',
    ),
  );
  assert.ok(!row.includes("Última decisión"));
  assert.ok(!row.includes("Firma GLF"));
  assert.ok(
    make(1, [risk("social", 3, 3, null, null)]).includes(
      "No aplica en esta fase",
    ),
  );
  assert.ok(
    make(2, [risk("social", 3, 3, null, null)]).includes(
      "Pendiente de evaluación",
    ),
  );
  assert.ok(make(2, []).includes("Sin riesgos identificados"));
});

test("Excel shows the bilingual theme name from the frozen rules rather than an internal identifier", () => {
  const themeId = "custom_12345678-1234-4123-8123-123456789012";
  const records = {
    applications: [
      {
        id: "theme-app",
        call_id: "call",
        rules_snapshot: {
          themes: [
            {
              id: themeId,
              label_es: "Restauración marina",
              label_en: "Marine restoration",
            },
          ],
        },
      },
    ],
    calls: [
      {
        id: "call",
        rules: {
          themes: [
            {
              id: themeId,
              label_es: "Nombre posterior",
              label_en: "Later name",
            },
          ],
        },
      },
    ],
    application_versions: [
      {
        application_id: "theme-app",
        revision: 1,
        payload: { concept: { title: "Proyecto", project_type: themeId } },
      },
    ],
  };
  for (const locale of ["es", "en"] as const) {
    const sheet = strFromU8(
      unzipSync(summaryWorkbook(records, locale))["xl/worksheets/sheet1.xml"],
    );
    assert.ok(
      sheet.includes(
        locale === "es" ? "Restauración marina" : "Marine restoration",
      ),
    );
    assert.ok(
      !sheet.includes(themeId) &&
        !sheet.includes("Nombre posterior") &&
        !sheet.includes("Later name"),
    );
  }
});
