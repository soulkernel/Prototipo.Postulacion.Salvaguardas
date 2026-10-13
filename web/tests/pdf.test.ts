import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { applicationPdf } from "../src/lib/pdf";
import { emptyPayload, newActivity, newRisk } from "../src/lib/domain";
import { alignmentVersion, newObjective } from "../src/lib/strategic-alignment";

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
        glf: ["GLF-L07"],
        contribution:
          "Recuperación de ecosistemas con participación comunitaria",
      },
      {
        ...newObjective("specific"),
        text: "Restaurar dos zonas degradadas",
        plan: ["E1"],
        ods: [14],
        glf: ["GLF-L07"],
        contribution: "Recuperación ecológica de sitios intervenidos",
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
});

test("document filenames use the immutable generation time in Galapagos and safe reference", async () => {
  const { documentFilename, documentStamp } =
    await import("../src/lib/document-name");
  assert.equal(documentStamp("2026-10-11T03:18:15.747Z"), "2026-10-10_211815");
  assert.equal(
    documentFilename("GLF-001", "concept", 7, "2026-10-11T03:18:15.747Z", "es"),
    "GLF-001_Nota-conceptual_v7_2026-10-10_211815_Galapagos_es.pdf",
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
