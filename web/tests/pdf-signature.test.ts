import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, PDFName, PDFHexString } from "pdf-lib";
import { detectPdfSignature } from "../src/lib/pdf-signature";

test("signature detection rejects unsigned PDF, plain signature text and empty signing placeholders", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Firma electronica /ByteRange /Sig");
  assert.equal(await detectPdfSignature(await pdf.save()), "missing");
  pdf.context.register(
    pdf.context.obj({
      Type: PDFName.of("Sig"),
      ByteRange: [0, 100, 200, 100],
      Contents: PDFHexString.of("00".repeat(100)),
    }),
  );
  assert.equal(await detectPdfSignature(await pdf.save()), "missing");
  assert.equal(
    await detectPdfSignature(new Uint8Array([1, 2, 3])),
    "unreadable",
  );
});

test("structural signature detection is not certificate or cryptographic validation", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const sig = pdf.context.obj({
    Type: PDFName.of("Sig"),
    ByteRange: [0, 100, 200, 100],
    Contents: PDFHexString.of("30" + "01".repeat(100)),
  });
  pdf.context.register(sig);
  assert.equal(await detectPdfSignature(await pdf.save()), "detected");
  sig.set(PDFName.of("ByteRange"), pdf.context.obj([0, 100, 200, 999999]));
  assert.equal(await detectPdfSignature(await pdf.save()), "missing");
});
