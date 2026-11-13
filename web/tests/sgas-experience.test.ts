import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFDocument } from "pdf-lib";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { emptyPayload, payloadSchema } from "../src/lib/domain";
import {
  emptySgasExperience,
  sgasExperienceSchema,
  sgasIssues,
  sgasSource,
  currentSgasDocument,
  sgasPresentation,
  sgasAnswerKeys,
} from "../src/lib/sgas-experience";
import { sgasPdf } from "../src/lib/sgas-pdf";
import { SgasExperienceFields } from "../src/components/sgas-experience-fields";
import {
  applicationStepFromQuery,
  applicationStepUrl,
} from "../src/lib/application-navigation";
import { applicationAttachments } from "../src/lib/attachment-requirements";
const complete = () => ({
  ...emptySgasExperience(),
  ...Object.fromEntries(sgasAnswerKeys.map((k) => [k, false])),
});

test("SGAS preserves old payloads, nullable unanswered drafts and strict stored values", () => {
  const p = emptyPayload();
  assert.ok(payloadSchema.safeParse(p).success);
  assert.equal(sgasIssues(undefined, false).length, 0);
  assert.equal(sgasIssues(undefined)[0], "sgas_experience");
  const draft = emptySgasExperience();
  assert.ok(sgasExperienceSchema.safeParse(draft).success);
  assert.equal(sgasIssues(draft).length, 9);
  const f = complete();
  assert.deepEqual(sgasIssues(f), []);
  for (const value of ["yes", 0, undefined])
    assert.equal(
      sgasExperienceSchema.safeParse({ ...f, gender_experts: value }).success,
      false,
    );
  assert.equal(
    sgasExperienceSchema.safeParse({ ...f, unexpected: true }).success,
    false,
  );
});
test("SGAS investigation and external expertise follow only the active branches without erasing history", () => {
  const f = complete();
  f.human_rights_involved = true;
  assert.deepEqual(sgasIssues(f), ["sgas_investigation_status"]);
  f.investigation_status = "Investigación ficticia en curso.";
  assert.deepEqual(sgasIssues(f), []);
  f.external_staff = true;
  f.internal_staff = true;
  f.external_expertise = null;
  assert.deepEqual(sgasIssues(f), ["sgas_external_expertise"]);
  f.external_expertise = false;
  assert.deepEqual(sgasIssues(f), []); // No expertise is a declaration, not rejection.
  f.human_rights_involved = false;
  f.external_staff = false;
  assert.deepEqual(sgasIssues(f), []);
  const source = sgasSource({ sgas_experience: f });
  assert.ok(
    !sgasPresentation(source, "es").some(
      (r) => r.detail === f.investigation_status,
    ),
  );
  assert.equal(f.investigation_status, "Investigación ficticia en curso.");
  assert.equal(sgasPresentation(source, "es").at(-1)?.answer, "No aplica");
});
test("SGAS generated-document freshness ignores object key order but follows answers and printed identity", () => {
  const c = {
    sgas_experience: complete(),
    applicant_type: "individual",
    applicant_name: "Persona QA",
    title: "Proyecto QA",
  };
  const source = sgasSource(c),
    doc = {
      id: crypto.randomUUID(),
      kind: "sgas_experience",
      file_name: "QA.pdf",
      created_at: new Date().toISOString(),
      generation_source: JSON.parse(JSON.stringify(source)),
    };
  assert.equal(currentSgasDocument(c, [doc])?.id, doc.id);
  doc.generation_source = Object.fromEntries(Object.entries(source).reverse());
  assert.equal(currentSgasDocument(c, [doc])?.id, doc.id);
  for (const patch of [
    { title: "Otro título" },
    { applicant_name: "Otra persona" },
    { applicant_type: "organization" },
    { sgas_experience: { ...complete(), gender_experts: true } },
  ])
    assert.equal(currentSgasDocument({ ...c, ...patch }, [doc]), undefined);
  assert.equal(
    currentSgasDocument({ ...c, cofinance_amount: 120 } as typeof c, [doc])?.id,
    doc.id,
  );
});
test("six-step URLs preserve legacy review and risk links and round-trip SGAS independently", () => {
  assert.equal(applicationStepFromQuery("3"), 3);
  assert.equal(applicationStepFromQuery("4"), 5);
  assert.equal(applicationStepFromQuery("5"), 5);
  for (let step = 0; step < 6; step++) {
    const u = new URL(
      applicationStepUrl(
        "https://example.test/applicant/qa?receipt=keep#summary",
        step,
      ),
      "https://example.test",
    );
    assert.equal(
      applicationStepFromQuery(
        u.searchParams.get("step"),
        u.searchParams.get("section"),
      ),
      step,
    );
    assert.equal(u.searchParams.get("receipt"), "keep");
    assert.equal(u.hash, "#summary");
  }
  assert.equal(applicationStepFromQuery("5", "sgas"), 4);
});
test("SGAS UI renders bilingual grouped radios without defaults, conditional details and individual wording", () => {
  for (const locale of ["es", "en"] as const) {
    const props = {
      individual: true,
      locale,
      onChange: () => {},
      checked: false,
      hasPrevious: false,
      onViewAttachments: () => {},
    };
    const html = renderToStaticMarkup(
      createElement(SgasExperienceFields, props),
    );
    assert.equal((html.match(/type="radio"/g) || []).length, 18);
    assert.doesNotMatch(html, /checked=""/);
    assert.doesNotMatch(html, /id="sgas-investigation_status"/);
    assert.match(
      html,
      locale === "es" ? /usted o su equipo/ : /you or your team/,
    );
    const filled = renderToStaticMarkup(
      createElement(SgasExperienceFields, {
        ...props,
        value: {
          ...complete(),
          human_rights_involved: true,
          external_staff: true,
        },
        checked: true,
      }),
    );
    assert.match(filled, /sgas-investigation_status/);
    assert.match(filled, /sgas-external_expertise/);
    assert.match(filled, /aria-invalid="true"/);
  }
});
test("Annex 1 remains a manual experience/CV upload separate from generated SGAS without duplicating call requirements", () => {
  const rules = { required_attachments: [] };
  const p = emptyPayload();
  assert.equal(
    applicationAttachments(rules, p.concept, 1)[0].id,
    "experience_capacity",
  );
  assert.equal(applicationAttachments(rules, p.concept, 2).length, 0);
  const custom = { ...rules, required_attachments: ["cv"] };
  assert.equal(applicationAttachments(custom, p.concept).length, 1);
});
test("actual SGAS PDF renderer produces readable ES/EN documents without a signature field", async () => {
  const folder = resolve(
    import.meta.dirname,
    "../../scratch/sgas-experience-qa/pdf",
  );
  await mkdir(folder, { recursive: true });
  const assets = {
    regular: new Uint8Array(
      await readFile(
        resolve(
          import.meta.dirname,
          "../node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff",
        ),
      ),
    ),
    bold: new Uint8Array(
      await readFile(
        resolve(
          import.meta.dirname,
          "../node_modules/@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff",
        ),
      ),
    ),
    logo: new Uint8Array(
      await readFile(resolve(import.meta.dirname, "../public/glf-logo.png")),
    ),
  };
  for (const locale of ["es", "en"] as const)
    for (const applicant_type of ["individual", "organization"]) {
      const source = sgasSource({
        title: "Proyecto ficticio — conservación y formación",
        applicant_name: "Proponente ficticio QA",
        applicant_type,
        sgas_experience: {
          ...complete(),
          human_rights_involved: true,
          investigation_status:
            "Estado ficticio: investigación en revisión. ".repeat(30),
          external_staff: true,
          external_expertise: true,
          international_standards: true,
          standards_detail:
            "Experiencia ficticia con normas ambientales y sociales.",
        },
      });
      const result = await sgasPdf({
        source,
        reference: "QA-SGAS-2026",
        revision: 2,
        generatedAt: "2026-10-21T16:00:00Z",
        locale,
        ...assets,
      });
      const pdf = await PDFDocument.load(result.bytes);
      assert.equal(pdf.getPages().length, result.pages);
      assert.equal(pdf.getForm().getFields().length, 0);
      assert.ok(result.bytes.length < 4194304);
      await writeFile(
        resolve(folder, `${applicant_type}-${locale}.pdf`),
        result.bytes,
      );
    }
});
