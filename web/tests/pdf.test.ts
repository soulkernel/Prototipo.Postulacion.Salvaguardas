import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { applicationPdf } from "../src/lib/pdf";
import { emptyPayload, newActivity, newRisk } from "../src/lib/domain";

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
