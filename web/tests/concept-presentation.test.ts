import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conceptSections,
  narrativeBlocks,
} from "../src/lib/concept-presentation";
import { emptyPayload } from "../src/lib/domain";

test("pasted paragraphs reflow without losing captions, list items or changing the source", () => {
  const source =
    "Beneficios para\nlas comunidades.\n" +
    " \n".repeat(14) +
    "Fig. 1. Distribución.\n\n• Conservación de\nhábitats.\n• Formación local.";
  const blocks = narrativeBlocks(source);
  assert.deepEqual(
    blocks.map((b) => (b.type === "paragraph" ? b.text : "")),
    [
      "Beneficios para las comunidades.",
      "Fig. 1. Distribución.",
      "• Conservación de hábitats.",
      "• Formación local.",
    ],
  );
  assert.ok(source.includes(" \n".repeat(14)));
});

test("explicit tables preserve cell relationships and malformed tables retain their content", () => {
  const table =
    "| Estrategia | Actividad | Avance | Éxito |\n| --- | --- | --- | --- |\n| Vigilancia pasiva | Observación | Reportes | Detección temprana |";
  const blocks = narrativeBlocks(table);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, "table");
  if (blocks[0].type === "table")
    assert.deepEqual(blocks[0].rows[0], [
      "Vigilancia pasiva",
      "Observación",
      "Reportes",
      "Detección temprana",
    ]);
  const malformed = narrativeBlocks(table + "\n| DATO NO RECTANGULAR |");
  assert.ok(malformed.every((b) => b.type === "paragraph"));
  assert.match(
    malformed.map((b) => (b.type === "paragraph" ? b.text : "")).join(" "),
    /DATO NO RECTANGULAR/,
  );
  assert.equal(
    narrativeBlocks(
      "Estrategias Actividades Indicadores\nVigilancia\npasiva",
    )[0].type,
    "paragraph",
    "Do not guess column assignments in flattened text",
  );
});

test("shared presentation explains objective/result relationships without fabricating missing targets", () => {
  const c = emptyPayload().concept;
  c.requested_amount = 100;
  c.cofinance_amount = 20;
  c.admin_cost = 5;
  c.project_results = [
    {
      id: crypto.randomUUID(),
      objective_id: "missing",
      result: "Formación",
      indicator: "Participantes",
      target: null,
      unit: "people",
      other_unit: "",
      evidence: "Listas",
    },
  ];
  const before = JSON.stringify(c);
  for (const locale of ["es", "en"] as const) {
    const sections = conceptSections(c, locale);
    assert.ok(sections.every((s) => s.introduction.length > 40));
    const results = sections.find((s) => s.id === "results")!;
    assert.match(
      results.blocks[0].type === "paragraph" ? results.blocks[0].text : "",
      locale === "es" ? /pendiente de identificar/ : /yet to be identified/,
    );
    const row = results.blocks.find((b) => b.type === "table");
    assert.equal(row?.type === "table" && row.rows[0][2].startsWith("—"), true);
  }
  assert.equal(
    JSON.stringify(c),
    before,
    "Rendering must never mutate stored or signed content",
  );
});
