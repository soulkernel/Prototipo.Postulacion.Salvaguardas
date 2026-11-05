import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFDocument } from "pdf-lib";
import {
  exclusionEntries,
  exclusionNotes,
  exclusionSource,
  exclusionTopics,
  filterExclusions,
  exclusionScopeMatches,
  exclusionHighlightParts,
} from "../src/lib/exclusion-list";
import { ExclusionList } from "../src/components/exclusion-list";
import { ExclusionMenuLink } from "../src/components/exclusion-menu-link";

test("the supplied four-page PDF remains byte-identical and its full numbering and references are retained", async () => {
  const bytes = readFileSync(`public${exclusionSource.path}`);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "db376093916a60f1b712846c5b3f04f700d99f60f7659c2202843cb036e23613",
  );
  assert.equal(
    exclusionSource.sha256,
    createHash("sha256").update(bytes).digest("hex"),
  );
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 4);
  assert.deepEqual(
    exclusionEntries.map((entry) => entry.id),
    Array.from({ length: 17 }, (_, i) => String(i + 1)),
  );
  assert.equal(exclusionEntries[0].bullets.length, 5);
  assert.deepEqual(
    exclusionEntries[16].children.map((entry) => entry.id),
    [..."abcdefgh"].map((letter) => `17${letter}`),
  );
  assert.deepEqual(
    exclusionNotes.map((note) => note.id),
    Array.from({ length: 10 }, (_, i) => i + 1),
  );
  assert.equal(exclusionNotes.flatMap((note) => note.links).length, 5);
  for (const entry of exclusionEntries) {
    assert.ok(
      entry.topics.every((topic) =>
        exclusionTopics.some((item) => item.id === topic),
      ),
    );
    const text = [
      entry.text,
      ...entry.bullets,
      ...entry.children.map((item) => item.text),
    ].join(" ");
    assert.ok(!text.includes("SGAS DEL GLF"));
    for (const id of [
      ...entry.notes,
      ...entry.children.flatMap((item) => item.notes),
    ]) {
      assert.ok(exclusionNotes.some((note) => note.id === id));
      assert.ok(text.includes(`[${id}]`));
    }
  }
});

test("search returns the complete clause with its exceptions, including matches within footnotes", () => {
  const gasoline = filterExclusions("GASOLINA");
  assert.deepEqual(
    gasoline.map((entry) => entry.id),
    ["11"],
  );
  assert.match(gasoline[0].text, /volúmenes significativos/);
  assert.deepEqual(gasoline[0].notes, [6]);
  assert.match(
    exclusionNotes.find((note) => note.id === 6)!.text,
    /Esto no incluye.*necesarios para las actividades regulares/,
  );
  assert.deepEqual(
    filterExclusions("beneficiarios regulares").map((entry) => entry.id),
    ["11"],
  );
  assert.deepEqual(
    filterExclusions("cerveza artesanal").map((entry) => entry.id),
    ["17"],
  );
  assert.equal(filterExclusions("cerveza")[0].children.length, 8);
  assert.match(
    exclusionEntries[3].text,
    /excepto impactos menores y manejables.*ganancia neta/,
  );
  assert.match(
    exclusionEntries[16].children[3].text,
    /excepto la adquisición de equipos médicos/,
  );
  assert.match(
    exclusionEntries[16].children[5].text,
    /a menos que pueda demostrarse.*\(i\).*\(ii\)/,
  );
  assert.match(
    exclusionEntries[16].children[7].text,
    /Categorías V.*VI.*a menos que/,
  );
});

test("case, accents, combined terms, thematic intersection and no-match results behave consistently", () => {
  const before = JSON.stringify(exclusionEntries);
  assert.deepEqual(filterExclusions("PETROLEO"), filterExclusions("petróleo"));
  assert.deepEqual(
    filterExclusions("  ÁREAS   PROTEGIDAS "),
    filterExclusions("areas protegidas"),
  );
  assert.deepEqual(
    filterExclusions("pesca", "fishing").map((entry) => entry.id),
    ["9"],
  );
  assert.deepEqual(filterExclusions("gasolina", "rights"), []);
  assert.deepEqual(filterExclusions("zzzinexistente"), []);
  assert.deepEqual(filterExclusions("<script>alert(1)</script>"), []);
  assert.equal(filterExclusions(" ").length, 17);
  assert.equal(exclusionScopeMatches("prohibiciones categoricas"), true);
  assert.equal(exclusionScopeMatches(""), false);
  assert.equal(exclusionScopeMatches("zzzinexistente"), false);
  assert.equal(JSON.stringify(exclusionEntries), before);
});

test("highlighting preserves original text and handles literal regex characters without interpreting them", () => {
  for (const [value, query] of [
    ["Petróleo y GASOLINA", "PETROLEO gasolina"],
    ["a+b (c)", "+b (c)"],
    ["pesca", "pesca pes"],
    ["Sin coincidencia", "xxx"],
  ]) {
    const parts = exclusionHighlightParts(value, query);
    assert.equal(parts.map((part) => part.text).join(""), value);
  }
  assert.deepEqual(exclusionHighlightParts("Petróleo", "petroleo"), [
    { text: "Petróleo", match: true },
  ]);
});

test("ES/EN controls keep Spanish policy intact, expose notes and announce results without submission controls", () => {
  for (const locale of ["es", "en"] as const) {
    const html = renderToStaticMarkup(createElement(ExclusionList, { locale }));
    assert.match(html, /role="status" aria-live="polite"/);
    assert.match(html, /id="exclusion-search"/);
    assert.match(html, /aria-describedby="exclusion-search-help"/);
    assert.match(html, /lang="es"/);
    assert.match(html, /Esto no incluye la compra de gasolina/);
    assert.match(html, /data-exclusion-note="8"/);
    assert.match(html, /exclusion-17h/);
    assert.match(html, /download=""/);
    assert.doesNotMatch(html, /<form|type="submit"/);
    assert.match(
      html,
      locale === "es" ? /17 de 17 apartados/ : /17 of 17 sections/,
    );
    if (locale === "en")
      assert.match(html, /An approved English version has not been supplied/);
  }
});

test("header reference opens separately with an accessible notice and protects the opener", () => {
  for (const locale of ["es", "en"] as const) {
    const html = renderToStaticMarkup(
      createElement(ExclusionMenuLink, { locale }),
    );
    assert.match(
      html,
      /href="\/exclusions" target="_blank" rel="noopener noreferrer"/,
    );
    assert.match(
      html,
      locale === "es" ? /Se abre en otra pestaña/ : /Opens in a new tab/,
    );
  }
});
