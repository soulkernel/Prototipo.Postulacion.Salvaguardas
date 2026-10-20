import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { applicationPdf } from "../src/lib/pdf";
import { emptyPayload, newActivity, newRisk } from "../src/lib/domain";
import {
  alignmentVersion,
  currentAlignmentVersion,
  newObjective,
} from "../src/lib/strategic-alignment";

test("concept and matrix PDFs embed fonts, paginate and contain a QR image", async () => {
  const payload = emptyPayload();
  for (const key of Object.keys(payload.concept)) {
    const k = key as keyof typeof payload.concept;
    if (typeof payload.concept[k] === "string")
      Object.assign(payload.concept, {
        [k]: "Información de prueba: protección de hábitats en Galápagos, participación y evaluación.",
      });
  }
  payload.concept.title = "PRUEBA FICTICIA · Restauración de hábitats";
  payload.concept.contact_name = "María Elena Pérez";
  payload.concept.applicant_type = "organization";
  payload.concept.ruc = "2090000000001";
  payload.concept.associated_organizations = [
    "Fundación Marina de Prueba",
    "Organización Comunitaria de Prueba",
  ];
  payload.concept.summary = "Conservación y participación comunitaria. ".repeat(
    90,
  );
  payload.concept.summary_parts = {
    context: payload.concept.summary,
    problem: "Problema ficticio",
    threats: "Amenaza ficticia",
    rationale: "Justificación ficticia",
    solution: "Solución ficticia",
    results: "Resultados ficticios",
  };
  payload.concept.requested_amount = 50000;
  payload.concept.strategic_alignment = {
    version: alignmentVersion,
    objectives: [
      {
        ...newObjective("general"),
        text: "Restaurar hábitats costeros",
        plan: ["E1"],
        ods: [14],
        glf: [],
        contribution:
          "Recuperación de ecosistemas con participación comunitaria",
      },
      {
        ...newObjective("specific"),
        text: "Restaurar dos zonas degradadas",
        plan: [],
        ods: [],
        glf: [],
        contribution: "",
      },
    ],
  };
  payload.budget = {
    version: "glf-annual-v1",
    currency: "USD",
    years: 2,
    lines: [
      {
        id: crypto.randomUUID(),
        year: 1,
        category: "personnel",
        description: "Coordinación del proyecto",
        glf: 1500000,
        other: 500000,
        remuneration: "yes",
      },
      {
        id: crypto.randomUUID(),
        year: 2,
        category: "equipment",
        description: "Equipos para la conservación marina",
        glf: 3500000,
        other: 0,
        remuneration: "no",
      },
    ],
  };
  const activity = newActivity();
  activity.title = "Restauración costera";
  activity.description = "Actividad ficticia para verificar exportación.";
  const risk = newRisk();
  Object.assign(risk, {
    name: "Alteración del hábitat",
    description: "Riesgo ficticio",
    probability: 3,
    severity: 4,
    residual_probability: 2,
    residual_severity: 2,
    cost: 100,
    responsible: "Responsable de prueba",
    location: "Santa Cruz",
    start_quarter: 1,
    end_quarter: 2,
    measures: [{ text: "Medida propuesta de prueba" }],
  });
  activity.risks = [risk];
  payload.activities = [activity];
  payload.phase2 = {
    detailed_proposal:
      "Contenido de la propuesta completa para verificar su integración.",
  };
  await mkdir(".test-artifacts", { recursive: true });
  for (const stage of [1, 2])
    for (const locale of ["es", "en"] as const)
      for (const kind of ["concept", "matrix"] as const) {
        const result = await applicationPdf({
          payload,
          stage,
          reference: "GLF-TEST-001",
          revision: 2,
          submittedAt: "2026-10-06T12:00:00Z",
          kind,
          locale,
          phase2Fields: [
            {
              id: "detailed_proposal",
              label_es: "Descripción detallada del proyecto",
              label_en: "Detailed project description",
            },
          ],
          downloadUrl:
            "https://example.test/documents/test/" + kind + "?lang=" + locale,
        });
        const pdf = await PDFDocument.load(result.bytes);
        assert.equal(pdf.getPageCount(), result.pages);
        assert.ok(result.bytes.length > 10000);
        assert.ok(
          pdf
            .getPages()
            .some((p) => String(p.node.Resources()).includes("XObject")),
        );
        await writeFile(
          ".test-artifacts/" + kind + "-" + locale + "-stage" + stage + ".pdf",
          result.bytes,
        );
      }
  const individual = structuredClone(payload);
  individual.concept.applicant_type = "individual";
  individual.concept.identity_number = "0123456789";
  individual.concept.residence_number = "RP-TEST-001";
  const individualPdf = await applicationPdf({
    payload: individual,
    stage: 1,
    reference: "GLF-INDIVIDUAL-001",
    revision: 1,
    submittedAt: "2026-10-14T20:00:00Z",
    kind: "concept",
    locale: "es",
    downloadUrl: "https://example.test/individual",
  });
  assert.ok(individualPdf.pages > 0);
  await writeFile(
    ".test-artifacts/concept-individual-identity.pdf",
    individualPdf.bytes,
  );
});

test("M15 PDF omits contribution only in v3, preserves historic v2 output and never removes beneficiaries", async () => {
  const p = emptyPayload();
  p.concept.title = "PRUEBA LOCAL M15 · Compatibilidad histórica";
  p.concept.beneficiaries = "BENEFICIARIOS_CONSERVADOS_M15";
  const general = {
    ...newObjective("general"),
    text: "Conservar hábitats",
    plan: ["E1"],
    ods: [14],
    contribution: "APORTE_HISTORICO_M15",
  };
  p.concept.strategic_alignment = {
    version: alignmentVersion,
    objectives: [
      general,
      { ...newObjective("specific"), text: "Restaurar hábitats" },
    ],
  };
  await mkdir(".test-artifacts", { recursive: true });
  for (const version of [alignmentVersion, currentAlignmentVersion] as const) {
    p.concept.strategic_alignment.version = version;
    const before = JSON.stringify(p);
    for (const locale of ["es", "en"] as const) {
      const result = await applicationPdf({
        payload: p,
        reference: "M15-LOCAL",
        revision: 1,
        submittedAt: "2026-10-19T18:00:00Z",
        kind: "concept",
        locale,
        downloadUrl: "https://example.test/m15",
        stage: 1,
      });
      assert.ok(result.pages > 0);
      await writeFile(
        `.test-artifacts/m15-${version === alignmentVersion ? "historic" : "new"}-${locale}.pdf`,
        result.bytes,
      );
    }
    assert.equal(JSON.stringify(p), before);
  }
});

test("M13 concept PDFs include complementary instruments in both languages without changing objective identifiers", async () => {
  const p = emptyPayload();
  p.concept.title = "PRUEBA LOCAL M13 · Otros instrumentos";
  const general = {
    ...newObjective("general"),
    text: "Conservar hábitats costeros",
    plan: ["E1"],
    ods: [14],
    contribution: "Conservación comunitaria",
    other_instruments: [
      {
        id: crypto.randomUUID(),
        name: "Plan ficticio M13",
        objective: "P1: Restaurar ecosistemas costeros",
      },
      {
        id: crypto.randomUUID(),
        name: "Plan local de prueba",
        objective: "O2: Participación comunitaria",
      },
    ],
  };
  p.concept.strategic_alignment = {
    version: alignmentVersion,
    objectives: [
      general,
      { ...newObjective("specific"), text: "Restaurar hábitats" },
    ],
  };
  const before = JSON.stringify(p);
  await mkdir(".test-artifacts", { recursive: true });
  for (const locale of ["es", "en"] as const) {
    const result = await applicationPdf({
      payload: p,
      reference: "M13-LOCAL",
      revision: 1,
      submittedAt: "2026-10-19T16:00:00Z",
      kind: "concept",
      locale,
      downloadUrl: "https://example.test/m13",
      stage: 1,
    });
    assert.ok(result.pages > 0);
    await writeFile(
      `.test-artifacts/m13-additional-${locale}.pdf`,
      result.bytes,
    );
  }
  assert.equal(JSON.stringify(p), before);
});

test("document filenames use the immutable generation time in Galapagos and safe reference", async () => {
  const { documentFilename, documentStamp } =
    await import("../src/lib/document-name");
  assert.equal(documentStamp("2026-10-11T03:18:15.747Z"), "2026-10-10_211815");
  assert.equal(
    documentFilename("GLF-001", "concept", 7, "2026-10-11T03:18:15.747Z", "es"),
    "GLF-001_Nota-conceptual_v7_2026-10-10_211815_Galapagos_es.pdf",
  );
  for (const locale of ["es", "en"] as const)
    assert.match(
      documentFilename(
        "GLF-001",
        "concept",
        8,
        "2026-10-11T03:18:15.747Z",
        locale,
        2,
      ),
      locale === "es" ? /Propuesta-completa_v8/ : /Full-proposal_v8/,
    );
  assert.ok(
    !documentFilename(
      'BAD/REF"',
      "matrix",
      1,
      "2026-01-01T00:00:00Z",
      "en",
    ).includes('"'),
  );
  assert.throws(() => documentStamp("invalid"));
});

test("document prose preserves selected policies and scores without inventing alignment", async () => {
  const { alignmentNarrative, riskNarrative } =
    await import("../src/lib/document-language");
  const objective = {
    ...newObjective("general"),
    text: "Conservar ecosistemas",
    plan: ["E1"],
    ods: [14],
    glf: ["GLF-L01"],
    contribution: "Aporte declarado por el aplicante.",
  };
  const es = alignmentNarrative(objective, "es").join("\n");
  assert.match(es, /contribuye a la siguiente política: E1/);
  assert.match(es, /el ODS 14/);
  assert.ok(es.includes(objective.contribution));
  assert.equal(
    alignmentNarrative(
      { ...objective, plan: [], ods: [], glf: [], contribution: "" },
      "en",
    ).length,
    1,
  );
  assert.match(riskNarrative(3, 4, "es"), /3 × 4 = 12.*riesgo alto/);
  assert.match(riskNarrative(4, 4, "en"), /16.*very high risk/);
  assert.match(riskNarrative(null, 4, "es"), /incompleta/);
});

test("result tables paginate long cells and redundant blank lines do not inflate pages", async () => {
  await mkdir(".test-artifacts", { recursive: true });
  for (const long of [false, true]) {
    const payload = emptyPayload();
    payload.concept.title = "Conservación marina y participación comunitaria";
    payload.concept.contact_name = "María Elena Pérez";
    payload.concept.applicant_type = "organization";
    payload.concept.ruc = "2090000000001";
    payload.concept.beneficiaries =
      "Comunidades costeras y organizaciones locales.\n\nParticipación en actividades educativas y oportunidades de formación.";
    payload.concept.sustainability =
      "Las organizaciones participantes mantendrán los materiales y las capacidades adquiridas.\n\nLa metodología podrá replicarse en otras islas.";
    payload.concept.project_results = [
      {
        id: crypto.randomUUID(),
        objective_id: "OE1",
        result: long
          ? "Resultado extenso de conservación marina con participación comunitaria. ".repeat(
              110,
            ) + "FIN RESULTADO"
          : "Mejorar las capacidades de conservación marina.",
        indicator: "Número de participantes que completan la formación.",
        target: 120,
        unit: "people",
        other_unit: "",
        evidence: "Listas de asistencia e informes de formación.",
      },
    ];
    const args = {
      payload,
      reference: "GLF-LAYOUT-001",
      revision: 1,
      submittedAt: "2026-10-13T12:00:00Z",
      kind: "concept" as const,
      locale: "es" as const,
      downloadUrl: "https://example.test/document",
      stage: 1,
    };
    const result = await applicationPdf(args);
    assert.ok(result.pages > 0 && result.pages < 20);
    await writeFile(
      `.test-artifacts/layout-${long ? "long" : "short"}.pdf`,
      result.bytes,
    );
    payload.concept.beneficiaries = payload.concept.beneficiaries.replace(
      /\n\n/g,
      "\n".repeat(30),
    );
    const spaced = await applicationPdf(args);
    assert.equal(
      spaced.pages,
      result.pages,
      "Blank pasted lines must not create empty pages",
    );
  }
});

test("GLF activity calendars appear in new concept and screening PDFs in ES/EN", async () => {
  const p = emptyPayload();
  Object.assign(p.concept, {
    title: "PRUEBA FICTICIA · Calendarios de actividades",
    applicant_type: "individual",
    applicant_name: "Persona ficticia QA",
    category_id: "small",
    requested_amount: 50000,
    cofinance_amount: 0,
    start_date: "2027-01-01",
    end_date: "2027-12-31",
    summary:
      "El proyecto ficticio propone restaurar un área de prueba mediante trabajo comunitario y seguimiento. Los resultados y fechas se utilizan exclusivamente para verificar el formulario.",
    beneficiaries:
      "La comunidad ficticia y los ecosistemas del sitio de prueba se beneficiarían de las actividades de conservación y capacitación.",
    sustainability:
      "La organización comunitaria ficticia dará continuidad a las acciones y compartirá la experiencia para facilitar su réplica.",
    monitoring:
      "Se realizarán visitas y registros de participación para comprobar el avance. Se evaluarán los resultados mediante reportes de prueba.",
  });
  const general = {
    ...newObjective("general", currentAlignmentVersion),
    text: "Conservar un hábitat ficticio mediante participación comunitaria",
    plan: ["E1"],
    ods: [14],
    glf: [],
  };
  const specific = {
    ...newObjective("specific", currentAlignmentVersion),
    text: "Restaurar el sitio ficticio de intervención",
    plan: [],
    ods: [],
    glf: [],
  };
  p.concept.strategic_alignment = {
    version: currentAlignmentVersion,
    objectives: [general, specific],
  };
  p.concept.project_results = [
    {
      id: crypto.randomUUID(),
      objective_id: specific.id,
      result: "Área de prueba con acciones iniciales de restauración",
      indicator: "Número de sitios con intervención documentada",
      target: 1,
      unit: "sites",
      other_unit: "",
      evidence: "Registro fotográfico ficticio y reporte de visita",
    },
  ];
  const source = {
    id: crypto.randomUUID(),
    dimension: "environmental" as const,
    name: "Perturbación temporal del hábitat ficticio",
  };
  p.concept.risk_register = [source];
  p.activities = [0, 1].map((i) => ({
    ...newActivity(),
    title: i
      ? "Monitoreo comunitario ficticio"
      : "Preparación del sitio ficticio",
    description:
      "Actividad de prueba para comprobar que el calendario preliminar se presenta de forma clara junto a su objetivo específico.",
    objective_ids: [specific.id],
    start_date: i ? "2027-03-01" : "2027-02-01",
    end_date: i ? "2027-06-30" : "2027-02-01",
    risks: [
      {
        ...newRisk(),
        source_id: source.id,
        name: source.name,
        dimension: source.dimension,
        description: "Perturbación temporal durante la actividad ficticia",
        probability: 1,
        severity: 2,
      },
    ],
  }));
  await mkdir("../scratch/glf-form-qa", { recursive: true });
  for (const locale of ["es", "en"] as const)
    for (const kind of ["concept", "matrix"] as const) {
      const bytes = await applicationPdf({
        payload: p,
        reference: "QA-CALENDARIOS",
        revision: 1,
        submittedAt: "2026-10-20T03:00:00Z",
        kind,
        locale,
        downloadUrl: "https://example.invalid/qa",
        stage: 1,
      });
      assert.ok((await PDFDocument.load(bytes.bytes)).getPageCount() >= 1);
      await writeFile(
        `../scratch/glf-form-qa/${kind}-${locale}.pdf`,
        bytes.bytes,
      );
    }
});
