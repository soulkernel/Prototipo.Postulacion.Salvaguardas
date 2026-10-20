import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyPayload, payloadSchema } from "../src/lib/domain";
import {
  initializePartners,
  partnerPatch,
  partnerRecords,
  partnerIssues,
  type PartnerOrganization,
} from "../src/lib/partners";
import {
  applicationAttachments,
  partnerLetterRequirements,
  partnerLetterKind,
  missingPartnerLetters,
  partnerLetterError,
  isPartnerLetterDocument,
  type AttachmentRules,
} from "../src/lib/attachment-requirements";
import { validateRequiredDocuments } from "../src/lib/attachment-validation";
import { uploadSelectionError } from "../src/lib/upload-selection";
import { conceptSections } from "../src/lib/concept-presentation";
const a = { id: "11111111-1111-4111-8111-111111111111", name: "Socio A" };
const b = { id: "22222222-2222-4222-8222-222222222222", name: "Socio B" };
const rules = {
  required_attachments: ["concept_signed", "matrix_signed", "other_required"],
};
const concept = (rows: PartnerOrganization[]) => ({
  ...emptyPayload().concept,
  ...partnerPatch(rows),
});
const pdf = new TextEncoder().encode("%PDF-1.4\nCarta local");

test("partner implementation support remains linked to stable IDs and appears in review/PDF without changing letter requirements", () => {
  const rows = [
    { ...a, support: "Personal técnico y seguimiento" },
    { ...b, support: "Equipos y coordinación comunitaria" },
  ];
  const c = concept(rows);
  assert.deepEqual(partnerIssues(c), []);
  assert.deepEqual(partnerIssues(concept([{ ...a, support: " " }])), [
    "partners",
  ]);
  assert.deepEqual(partnerIssues(concept([a])), ["partners"]);
  assert.ok(
    payloadSchema.safeParse({ ...emptyPayload(), concept: concept([a]) })
      .success,
  ); // Legacy drafts remain readable/saveable.
  assert.ok(payloadSchema.safeParse({ ...emptyPayload(), concept: c }).success);
  assert.equal(c.partners, "1. Socio A\n2. Socio B"); // Legacy name mirror keeps its existing contract and size.
  const reopened = JSON.parse(
    JSON.stringify(
      concept([rows[1], { ...rows[0], name: "Socio renombrado" }]),
    ),
  );
  assert.equal(reopened.partner_organizations[1].support, rows[0].support);
  assert.equal(
    partnerLetterRequirements(reopened, rules)[1].id,
    partnerLetterKind(a.id),
  );
  for (const locale of ["es", "en"] as const) {
    const section = conceptSections(c, locale).find(
      (s) => s.id === "partners",
    )!;
    assert.equal(section.blocks[0].type, "table");
    if (section.blocks[0].type === "table")
      assert.deepEqual(
        section.blocks[0].rows,
        rows.map((p) => [p.name, p.support]),
      );
  }
  assert.equal(
    conceptSections(concept([a]), "es").some((s) => s.id === "partners"),
    false,
  ); // No invented historic description.
});

test("M05 zero/blank/one/many partners: no unnamed or generic duplicate requirements", () => {
  assert.equal(partnerLetterRequirements(concept([]), rules).length, 0);
  assert.equal(
    partnerLetterRequirements(concept([{ ...a, name: " " }]), rules).length,
    0,
  );
  assert.deepEqual(partnerIssues(concept([{ ...a, name: " " }])), ["partners"]);
  assert.equal(partnerLetterRequirements(concept([a]), rules).length, 1);
  const rows = partnerLetterRequirements(concept([a, b]), rules);
  assert.deepEqual(
    rows.map((r) => r.label_es),
    ["Carta de apoyo de Socio A", "Carta de apoyo de Socio B"],
  );
  assert.equal(rows[0].label_en, "Letter of support from Socio A");
  const generic = {
    ...rules,
    required_attachments: [...rules.required_attachments, "partner_letters"],
  };
  assert.equal(applicationAttachments(generic, concept([a, b])).length, 5);
  assert.ok(
    !applicationAttachments(generic, concept([])).some(
      (r) => r.id === "partner_letters",
    ),
  );
  assert.deepEqual(
    applicationAttachments(rules, concept([])).map((r) => r.id),
    rules.required_attachments,
  );
});

test("M05 stable IDs survive rename, reorder, add, remove, JSON save/reopen without reassigning letters", () => {
  const docs = [{ kind: partnerLetterKind(a.id) }];
  const renamed = { ...a, name: "Socio A renombrado" };
  const c = JSON.parse(JSON.stringify(concept([b, renamed])));
  assert.deepEqual(
    missingPartnerLetters(c, rules, docs).map((r) => r.label_es),
    ["Carta de apoyo de Socio B"],
  );
  assert.equal(partnerLetterRequirements(c, rules)[1].id, docs[0].kind);
  assert.deepEqual(missingPartnerLetters(concept([renamed]), rules, docs), []);
  assert.deepEqual(
    missingPartnerLetters(concept([b]), rules, docs).map((r) => r.id),
    [partnerLetterKind(b.id)],
  );
  assert.equal(docs[0].kind, partnerLetterKind(a.id));
  assert.equal(isPartnerLetterDocument(rules, docs[0].kind), true);
});

test("M05 legacy names receive IDs only when explicitly initialized, never infer old file associations", () => {
  const old = {
    partners: "",
    associated_organizations: ["Socio A", "Socio B"],
  };
  assert.deepEqual(
    partnerRecords(old).map((p) => p.id),
    ["", ""],
  );
  const rows = initializePartners(old);
  const converted = concept(rows);
  assert.deepEqual(initializePartners(converted), rows);
  assert.equal(
    missingPartnerLetters(converted, rules, [{ kind: "partner_letters" }])
      .length,
    2,
  );
  assert.deepEqual(old, {
    partners: "",
    associated_organizations: ["Socio A", "Socio B"],
  });
  assert.ok(
    payloadSchema.safeParse({ ...emptyPayload(), concept: converted }).success,
  );
  assert.ok(
    !payloadSchema.safeParse({ ...emptyPayload(), concept: concept([a, a]) })
      .success,
  );
});

test("M05 inherited call formats and conditions are retained per letter; no new format/size limit", () => {
  const configured: AttachmentRules = {
    required_attachments: ["support_letter"],
    attachment_requirements: [
      {
        id: "support_letter",
        label_es: "Cartas de apoyo de organizaciones asociadas",
        label_en: "Letters of support from partner organizations",
        formats: ["pdf"],
        conditions: [],
        instructions_es: "Instrucción",
        instructions_en: "Instruction",
      },
    ],
  };
  const r = partnerLetterRequirements(concept([a]), configured)[0];
  assert.deepEqual(r.formats, ["pdf"]);
  assert.equal(r.instructions_es, "Instrucción");
  assert.equal(
    uploadSelectionError([{ name: "carta.txt", size: 10 }], ".pdf"),
    "format",
  );
  assert.equal(
    uploadSelectionError(
      [{ name: "carta.pdf", size: 4 * 1024 * 1024 + 1 }],
      ".pdf",
    ),
    "size",
  );
});

test("M05 server validator rejects missing, unreadable, invalid files and identifies the exact organization", async () => {
  const req = partnerLetterRequirements(concept([a, b]), rules);
  const file = {
    kind: req[0].id,
    file_name: "carta.pdf",
    storage_path: "private/a.pdf",
  };
  const error = await validateRequiredDocuments(req, [file], async () => pdf);
  assert.equal(
    error,
    "GLF_PARTNER_LETTER_REQUIRED:" + b.id.replaceAll("-", ""),
  );
  assert.match(partnerLetterError(error!, concept([a, b]), "es")!, /Socio B/);
  assert.match(partnerLetterError(error!, concept([a, b]), "en")!, /Socio B/);
  assert.equal(
    await validateRequiredDocuments([req[0]], [file], async () => pdf),
    null,
  );
  assert.match(
    (await validateRequiredDocuments([req[0]], [file], async () => {
      throw Error("offline");
    }))!,
    /^GLF_PARTNER_LETTER_INVALID:/,
  );
  assert.match(
    (await validateRequiredDocuments(
      [req[0]],
      [file],
      async () => new Uint8Array([0]),
    ))!,
    /^GLF_PARTNER_LETTER_INVALID:/,
  );
  assert.equal(
    await validateRequiredDocuments([], [], async () => {
      throw Error("must not load");
    }),
    null,
  );
});
