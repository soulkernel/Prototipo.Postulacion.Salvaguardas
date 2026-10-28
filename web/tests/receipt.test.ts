import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import {
  receiptAttachments,
  receiptDate,
  receiptNumber,
} from "../src/lib/receipt";
import { receiptPdf } from "../src/lib/receipt-pdf";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
];
test("receipt resolves only frozen attachments with matching checksums, preferring the latest received file", () => {
  const snapshot = [
    { id: ids[0], kind: "concept_signed", file_name: "old.pdf", sha256: "a" },
    {
      id: ids[1],
      kind: "concept_signed",
      file_name: "concept-signed.pdf",
      sha256: "b",
    },
    {
      id: ids[2],
      kind: "matrix_signed",
      file_name: "assessment-signed.pdf",
      sha256: "c",
    },
  ];
  const stored = [
    { id: ids[0], sha256: "a", created_at: "2026-10-10T10:00:00Z" },
    { id: ids[1], sha256: "b", created_at: "2026-10-10T11:00:00Z" },
    { id: ids[2], sha256: "c", created_at: "2026-10-10T11:00:00Z" },
    {
      id: ids[3],
      sha256: "new-after-reopening",
      created_at: "2026-10-11T12:00:00Z",
    },
  ];
  assert.deepEqual(
    receiptAttachments(snapshot, stored).map((d) => d.id),
    [ids[1], ids[2]],
  );
  assert.equal(
    receiptAttachments(
      snapshot,
      stored.map((d) => ({ ...d, sha256: "changed" })),
    ).length,
    0,
  );
  assert.deepEqual(receiptAttachments(null, stored), []);
  assert.notEqual(receiptNumber(ids[0]), receiptNumber(ids[1]));
  assert.match(
    receiptDate("2026-10-11T03:18:15Z", "es"),
    /sábado.*10.*octubre.*2026.*21:18:15/,
  );
});

test("receipt PDF fits normal submissions on one page with two document QR images in both languages", async () => {
  await mkdir(".test-artifacts", { recursive: true });
  for (const locale of ["es", "en"] as const) {
    const bytes = await receiptPdf({
      id: ids[0],
      reference: "GLF-2026-001",
      title: "Conservación marina y educación comunitaria en Galápagos",
      responsible: "María Elena Pérez",
      actorId: ids[3],
      category: locale === "es" ? "Mediana" : "Medium",
      stage: 1,
      revision: 8,
      receivedAt: "2026-10-11T03:18:15Z",
      baseUrl: "https://example.test",
      locale,
      attachments: [
        {
          id: ids[1],
          kind: "concept_signed",
          file_name: "GLF-2026-001_Nota-conceptual_v7_firmada.pdf",
          sha256: "b",
        },
        {
          id: ids[2],
          kind: "matrix_signed",
          file_name: "GLF-2026-001_Evaluacion-AS_v7_firmada.pdf",
          sha256: "c",
        },
      ],
    });
    const doc = await PDFDocument.load(bytes);
    assert.equal(doc.getPageCount(), 1);
    assert.equal(doc.getTitle(), receiptNumber(ids[0]));
    assert.equal(
      doc.getCreationDate()?.toISOString(),
      "2026-10-11T03:18:15.000Z",
    );
    const resources = doc.getPage(0).node.Resources()!.toString();
    assert.match(resources, /XObject/);
    await writeFile(`.test-artifacts/receipt-${locale}.pdf`, bytes);
  }
});
