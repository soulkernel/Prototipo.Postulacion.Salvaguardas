import { test } from "node:test";
import assert from "node:assert/strict";
import {
  conceptSections,
  narrativeBlocks,
  narrativeTextForEditing,
} from "../src/lib/concept-presentation";
import { emptyPayload } from "../src/lib/domain";
import { emptySummary, projectSummary } from "../src/lib/summary";
import { adjustNarrativeLineBreaks } from "../src/lib/narrative-editing";

test("explicit line-break suggestion reflows imported wraps without changing words or captions", () => {
  const source =
    "La comunidad participa en las actividades de conservación costera y monitoreo de\n" +
    "aves marinas en las islas.\n" +
    " \n".repeat(13) +
    "Fig. 1. Colonias de aves.\n\n• Formación local.\n• Vigilancia sanitaria.";
  const adjusted = adjustNarrativeLineBreaks(source);
  assert.match(adjusted, /monitoreo de aves marinas/);
  assert.ok(!adjusted.includes("\n\n\n"));
  assert.match(
    adjusted,
    /\n\nFig\. 1\. Colonias de aves\.\n\n• Formación local\.\n• Vigilancia sanitaria\./,
  );
  assert.equal(
    adjusted.replace(/\s+/g, " ").trim(),
    source.replace(/\s+/g, " ").trim(),
  );
  assert.equal(adjustNarrativeLineBreaks(adjusted), adjusted);
  assert.ok(source.includes(" \n".repeat(13)), "The source is never mutated");
});

test("line-break preview preserves intentional labels, lists, tables, paragraphs and empty fields", () => {
  for (const source of [
    "",
    "Texto breve.\nOtra línea.\n\nOtro párrafo.",
    "Componente: Replicabilidad\nDescripción: La metodología permite replicar el trabajo en otras islas.",
    "Strategy: Passive surveillance\nActivity: Observation\nProgress indicators: Reports\nSuccess indicators: Early detection",
    "• " +
      "Actividad comunitaria. ".repeat(5).trimEnd() +
      "\n  • Detalle subordinado\n• Otra actividad",
    "1. Un resultado\n2. Otro resultado",
    "| Componente | Descripción |\n| --- | --- |\n| Continuidad | Comunidad |",
    "Columna A\tColumna B\nvalor A\tvalor B",
    "https://example.org/" + "ruta/".repeat(20) + "\nDescripción de la fuente.",
  ]) {
    assert.equal(adjustNarrativeLineBreaks(source), source);
  }
});

test("accepted line-break adjustment retains review/PDF blocks and labelled relationships", () => {
  const source =
    "Estrategia: Vigilancia\nActividad: Recorridos\nIndicadores de avance: Reportes\nIndicadores de éxito: Eventos identificados\n\n" +
    "La comunidad participa en las actividades de conservación costera y monitoreo de\naves marinas.";
  assert.deepEqual(
    narrativeBlocks(adjustNarrativeLineBreaks(source)),
    narrativeBlocks(source),
  );
  const concept = emptyPayload().concept;
  for (const key of ["beneficiaries", "sustainability", "monitoring"] as const)
    concept[key] = source;
  const before = JSON.stringify(concept);
  for (const locale of ["es", "en"] as const) {
    const original = conceptSections(concept, locale);
    const adjustedConcept = { ...concept };
    for (const key of [
      "beneficiaries",
      "sustainability",
      "monitoring",
    ] as const) {
      adjustedConcept[key] = adjustNarrativeLineBreaks(concept[key]);
    }
    assert.deepEqual(conceptSections(adjustedConcept, locale), original);
  }
  assert.equal(JSON.stringify(concept), before);
});

test("review and PDF share the integrated summary without restoring six headings or mutating drafts", () => {
  const c = emptyPayload().concept;
  c.summary_parts = {
    context: "Situación actual.",
    problem: "Necesidad identificada.",
    threats: "Presiones existentes.",
    rationale: "Motivo de intervención.",
    solution: "Acciones propuestas.",
    results: "Cambios esperados.",
  };
  const before = JSON.stringify(c);
  for (const locale of ["es", "en"] as const) {
    const summary = conceptSections(c, locale).find((s) => s.id === "summary")!;
    assert.equal(
      summary.title,
      locale === "es" ? "Resumen del proyecto" : "Project summary",
    );
    assert.deepEqual(
      summary.blocks,
      projectSummary(c)
        .split("\n\n")
        .map((text) => ({ type: "paragraph", text })),
    );
  }
  assert.equal(JSON.stringify(c), before);
  c.summary = "Texto integrado actualizado.\n\nOtro párrafo.";
  c.summary_parts = { ...emptySummary };
  const summary = conceptSections(c, "es").find((s) => s.id === "summary")!;
  assert.deepEqual(summary.blocks, [
    { type: "paragraph", text: "Texto integrado actualizado." },
    { type: "paragraph", text: "Otro párrafo." },
  ]);
});

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

// The complete form must hydrate before the user can reach the review.
test("country names and order are shared by server and browser for every supported country", async () => {
  const { default: options } =
    await import("../src/lib/phone-country-options.json");
  const { getCountries, getCountryCallingCode } =
    await import("libphonenumber-js/max");
  for (const locale of ["es", "en"] as const) {
    assert.equal(options[locale][0].code, "EC");
    assert.deepEqual(
      options[locale].map((c) => c.code).sort(),
      getCountries().sort(),
    );
    assert.ok(
      options[locale].every(
        (c) =>
          c.label.trim() &&
          getCountryCallingCode(
            c.code as Parameters<typeof getCountryCallingCode>[0],
          ),
      ),
    );
  }
});

test("plain text editing preserves table relationships and reflects the latest edits in the outputs", () => {
  for (const [headers, cells] of [
    [
      [
        "Estrategia",
        "Actividad",
        "Indicadores de avance",
        "Indicadores de éxito",
      ],
      ["Vigilancia", "Observación", "Reportes", "Detección"],
    ],
    [
      ["Componente", "Descripción"],
      ["Replicabilidad", "Metodología reutilizable"],
    ],
    [
      ["Objetivo específico", "Resultados previstos"],
      ["OE1", "Resultados originales"],
    ],
  ]) {
    const source = `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n| ${cells.join(" | ")} |`;
    const text = narrativeTextForEditing(source);
    assert.ok(!text.includes("|") && !text.includes("<br>"));
    assert.deepEqual(narrativeBlocks(text), narrativeBlocks(source));
    const last = cells[cells.length - 1];
    const edited = text.replace(last, "Contenido actualizado");
    const blocks = narrativeBlocks(edited);
    assert.equal(
      blocks[0].type === "table" && blocks[0].rows[0].at(-1),
      "Contenido actualizado",
    );
    assert.equal(
      narrativeTextForEditing(edited),
      edited,
      "Do not rewrite text or move the cursor while typing",
    );
  }
});

test("readable editing keeps multiline cells, subsequent prose and unstructured narratives intact", () => {
  const source =
    "| Componente | Descripción |\n| --- | --- |\n| Continuidad | • Capacitación<br>• Materiales |\n| Replicabilidad | Otras islas |\n\nExplicación adicional.";
  assert.deepEqual(
    narrativeBlocks(narrativeTextForEditing(source)),
    narrativeBlocks(source),
  );
  const incomplete =
    "Componente: Continuidad\nTexto sin una descripción identificada.";
  assert.equal(narrativeBlocks(incomplete)[0].type, "paragraph");
  const normal =
    "Las comunidades mantendrán los materiales.\n\nSe evaluarán nuevas oportunidades.";
  assert.equal(narrativeTextForEditing(normal), normal);
});
