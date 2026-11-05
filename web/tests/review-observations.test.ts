import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import {
  authorReference,
  proponentIdentification,
  justifiedWords,
} from "../src/lib/document-presentation";
import { riskMapEntries, riskMapSummary } from "../src/lib/risk-map";
import { inboxPaging } from "../src/lib/inbox-page";
import { applicationPdf } from "../src/lib/pdf";
import { receiptPdf } from "../src/lib/receipt-pdf";
import { emptyPayload, newActivity, newRisk } from "../src/lib/domain";

test("map summaries count assessments, keep missing ratings separate and never average categories", () => {
  const p = emptyPayload();
  const a = newActivity();
  a.risks = Array.from({ length: 6 }, () => ({
    ...newRisk(),
    probability: 3,
    severity: 3,
  }));
  p.activities = [a];
  const same = riskMapSummary(riskMapEntries(p), "es");
  assert.deepEqual(same.counts, { low: 0, medium: 6, high: 0, very_high: 0 });
  assert.match(same.text, /6 evaluaciones/);
  assert.match(same.text, /3 × gravedad 3 = 9/);
  a.risks.push({ ...newRisk(), probability: 5, severity: null });
  const partial = riskMapSummary(riskMapEntries(p), "en");
  assert.equal(partial.complete.length, 6);
  assert.equal(partial.pending.length, 1);
  assert.equal(partial.counts.low, 0);
  a.risks = Array.from({ length: 25 }, (_, i) => ({
    ...newRisk(),
    probability: (i % 5) + 1,
    severity: Math.floor(i / 5) + 1,
  }));
  const mixed = riskMapSummary(riskMapEntries(p), "en");
  assert.deepEqual(mixed.counts, { low: 8, medium: 7, high: 6, very_high: 4 });
  assert.doesNotMatch(mixed.text, /Probability/);
  assert.equal(
    riskMapSummary(riskMapEntries(p, true), "es").pending.length,
    25,
  );
  assert.match(riskMapSummary([], "es").text, /No hay evaluaciones/);
  assert.match(
    riskMapSummary(riskMapEntries(p, true), "en").text,
    /cannot yet be placed/,
  );
});

test("readable initial and residual PDF maps render complete, mixed, pending and empty cases in both languages", async () => {
  await mkdir(".test-artifacts/risk-map", { recursive: true });
  for (const scenario of ["same", "mixed", "pending", "empty"] as const) {
    const p = emptyPayload();
    p.concept.title = "PRUEBA FICTICIA · Mapa de riesgos";
    const a = newActivity();
    a.title = "Actividad de conservación y observación costera";
    a.risks =
      scenario === "empty"
        ? []
        : Array.from({ length: scenario === "mixed" ? 25 : 6 }, (_, i) => ({
            ...newRisk(),
            name: `Riesgo de prueba ${i + 1}`,
            probability: scenario === "mixed" ? (i % 5) + 1 : 3,
            severity:
              scenario === "pending"
                ? null
                : scenario === "mixed"
                  ? Math.floor(i / 5) + 1
                  : 3,
            residual_probability: 1,
            residual_severity: i % 2 === 0 ? 1 : null,
          }));
    p.activities = [a];
    for (const locale of ["es", "en"] as const) {
      const pdf = await applicationPdf({
        payload: p,
        reference: "GLF-QA-MAP",
        revision: 1,
        submittedAt: "2026-11-04T15:00:00Z",
        kind: "matrix",
        locale,
        downloadUrl: "https://example.test/qa",
        stage: 2,
        documentMetadata: { format_version: 3, author_name: "Equipo Ficticio" },
      });
      assert.ok((await PDFDocument.load(pdf.bytes)).getPageCount() > 1);
      await writeFile(
        `.test-artifacts/risk-map/${scenario}-${locale}.pdf`,
        pdf.bytes,
      );
    }
  }
});

test("document identification uses the submitted proponent and a stable Galapagos year without fabricating authors", () => {
  assert.match(
    authorReference(
      "María de los Ángeles Pérez",
      "2027-01-01T02:00:00Z",
      4,
      "es",
    ),
    /^2026 · MÁP · v4$/,
  );
  assert.match(
    authorReference("", "2026-11-04T12:00:00Z", 2, "en"),
    /Author not recorded/,
  );
  assert.equal(
    proponentIdentification(
      {
        applicant_type: "individual",
        identity_number: "0123456789",
        ruc: "2099999999001",
      },
      "es",
    ).value,
    "0123456789",
  );
  assert.equal(
    proponentIdentification(
      {
        applicant_type: "organization",
        identity_number: "0123456789",
        ruc: "2099999999001",
      },
      "en",
    ).value,
    "2099999999001",
  );
  assert.match(
    proponentIdentification({ applicant_type: "individual" }, "es").value,
    /No registrado/,
  );
});
test("justification preserves final lines, lists and long words", () => {
  const measure = (s: string) => s.length * 5;
  assert.equal(justifiedWords("texto final", 100, measure, 11, true), null);
  assert.equal(justifiedWords("• una lista", 100, measure, 11, false), null);
  assert.equal(justifiedWords("palabralarga", 100, measure, 11, false), null);
  const words = justifiedWords(
    "texto con varias palabras",
    130,
    measure,
    11,
    false,
  )!;
  assert.equal(words.at(-1)!.x + measure(words.at(-1)!.text), 130);
  assert.deepEqual(inboxPaging({ page: "-1", size: "999" }), {
    page: 1,
    size: 10,
  });
  assert.deepEqual(inboxPaging({ page: "3", size: "25" }), {
    page: 3,
    size: 25,
  });
});
test("maps keep activity evaluations distinct and do not fabricate residual ratings", () => {
  const p = emptyPayload();
  const a = newActivity();
  a.title = "Actividad de prueba";
  const r = newRisk();
  Object.assign(r, {
    name: "Riesgo de prueba",
    probability: 4,
    severity: 4,
    residual_probability: 2,
    residual_severity: 2,
  });
  a.risks = [r];
  p.activities = [a, { ...a, id: crypto.randomUUID() }];
  assert.equal(riskMapEntries(p).length, 2);
  assert.equal(riskMapEntries(p)[0].level, "very_high");
  assert.equal(riskMapEntries(p, true)[0].level, "low");
  p.activities[0].risks[0].residual_severity = null;
  assert.equal(riskMapEntries(p, true)[0].score, null);
});
test("updated PDF copies and new formats render in both languages without changing historic default output", async () => {
  const p = emptyPayload();
  Object.assign(p.concept, {
    title: "PRUEBA FICTICIA — Evaluación de conservación costera",
    contact_name: "María Elena Pérez",
    applicant_type: "individual",
    identity_number: "0123456789",
    summary:
      "La propuesta contempla actividades de conservación y seguimiento ambiental con participación comunitaria. ".repeat(
        30,
      ),
  });
  const a = newActivity();
  a.title = "Campañas de observación";
  a.description =
    "Documentar las condiciones ambientales para planificar acciones de conservación. ".repeat(
      12,
    );
  a.risks = Array.from({ length: 6 }, (_, i) => ({
    ...newRisk(),
    name: `Riesgo de prueba ${i + 1}`,
    description:
      "El trabajo puede generar alteraciones temporales en el entorno. ".repeat(
        5,
      ),
    probability: (i % 5) + 1,
    severity: 5,
    residual_probability: 1,
    residual_severity: 2,
  }));
  p.activities = [a];
  const base = {
    payload: p,
    reference: "GLF-QA-2026-0001",
    revision: 3,
    submittedAt: "2026-11-04T15:00:00Z",
    stage: 1,
    downloadUrl: "https://example.test/documents/qa",
    conceptLayoutVersion: null,
  };
  await mkdir(".test-artifacts/review-observations", { recursive: true });
  for (const locale of ["es", "en"] as const)
    for (const kind of ["concept", "matrix"] as const) {
      const original = await applicationPdf({ ...base, locale, kind });
      const copy = await applicationPdf({
        ...base,
        locale,
        kind,
        updatedCopy: true,
      });
      const enhanced = await applicationPdf({
        ...base,
        locale,
        kind,
        documentMetadata: {
          format_version: 2,
          author_name: "María Elena Pérez",
        },
      });
      const originalAgain = await applicationPdf({ ...base, locale, kind });
      assert.deepEqual(original.bytes, originalAgain.bytes);
      assert.notDeepEqual(original.bytes, copy.bytes);
      assert.ok((await PDFDocument.load(enhanced.bytes)).getPageCount() > 0);
      await writeFile(
        `.test-artifacts/review-observations/${kind}-${locale}.pdf`,
        enhanced.bytes,
      );
      await writeFile(
        `.test-artifacts/review-observations/${kind}-${locale}-consulta.pdf`,
        copy.bytes,
      );
    }
  const full = await applicationPdf({
    ...base,
    locale: "es",
    kind: "matrix",
    stage: 2,
    documentMetadata: { format_version: 2, author_name: "María Elena Pérez" },
  });
  await writeFile(
    ".test-artifacts/review-observations/matrix-phase2.pdf",
    full.bytes,
  );
  const receipt = await receiptPdf({
    id: crypto.randomUUID(),
    reference: base.reference,
    title: p.concept.title,
    responsible: p.concept.contact_name,
    actorId: crypto.randomUUID(),
    identification: proponentIdentification(p.concept, "es"),
    category: "Pequeña",
    stage: 1,
    revision: 3,
    receivedAt: base.submittedAt,
    attachments: [],
    baseUrl: "https://example.test",
    locale: "es",
  });
  assert.equal((await PDFDocument.load(receipt)).getPageCount(), 1);
  await writeFile(".test-artifacts/review-observations/receipt.pdf", receipt);
});
