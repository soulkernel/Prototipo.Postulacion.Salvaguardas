export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };
const bullet = /^(?:[-*•]\s+|\d+[.)]\s+)/;
const labelledLayouts = [
  ["Estrategia", "Actividad", "Indicadores de avance", "Indicadores de éxito"],
  ["Strategy", "Activity", "Progress indicators", "Success indicators"],
  ["Componente", "Descripción"],
  ["Component", "Description"],
  ["Objetivo específico", "Resultados previstos"],
  ["Specific objective", "Expected results"],
];
const labelKey = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
function labelledRow(group: string[], headers: string[]): string[] | null {
  const row: string[] = [];
  for (const line of group) {
    const colon = line.indexOf(":");
    const label = colon >= 0 ? labelKey(line.slice(0, colon)) : "";
    if (
      row.length < headers.length &&
      label === labelKey(headers[row.length])
    ) {
      row.push(line.slice(colon + 1).trim());
    } else if (headers.some((h) => label === labelKey(h)) || !row.length) {
      return null;
    } else {
      row[row.length - 1] += "\n" + line;
    }
  }
  return row.length === headers.length ? row : null;
}

/** Existing imported tables appear as readable text in the original text fields.
 * No change is persisted until the applicant edits; plain text is left untouched.
 */
export function narrativeTextForEditing(value: string): string {
  if (!/^\s*\|.+\|\s*\n\s*\|[\s:|\-]+\|/m.test(value)) return value;
  return narrativeBlocks(value)
    .map((b) =>
      b.type === "paragraph"
        ? b.text
        : b.rows
            .map((row) =>
              row.map((cell, i) => `${b.headers[i]}: ${cell}`).join("\n"),
            )
            .join("\n\n"),
    )
    .join("\n\n");
}
/** Reflow extracted lines without rewriting facts, removing captions or merging lists. */
export function narrativeBlocks(value: string): ContentBlock[] {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ContentBlock[] = [];
  let paragraph = "";
  const flush = () => {
    if (paragraph.trim())
      blocks.push({ type: "paragraph", text: paragraph.trim() });
    paragraph = "";
  };
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split(/(?<!\\)\|/)
      .map((v) =>
        v
          .trim()
          .replace(/\\\|/g, "|")
          .replace(/<br\s*\/?\s*>/gi, "\n"),
      );
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Explicit labels preserve table relationships after editing in a normal
    // textarea. Never infer relationships from unlabelled prose.
    const layout = labelledLayouts.find(
      (h) =>
        labelKey(line.split(":")[0]) === labelKey(h[0]) && line.includes(":"),
    );
    if (layout) {
      let end = i;
      const rows: string[][] = [];
      while (end < lines.length) {
        const start = end;
        const group: string[] = [];
        while (end < lines.length && lines[end].trim())
          group.push(lines[end++].trim());
        const row = labelledRow(group, layout);
        if (!row) {
          end = start;
          break;
        }
        rows.push(row);
        while (end < lines.length && !lines[end].trim()) end++;
      }
      if (rows.length) {
        flush();
        blocks.push({ type: "table", headers: layout, rows });
        i = end - 1;
        continue;
      }
    }
    // Only explicit, rectangular tables are interpreted. Ambiguous pasted text stays prose.
    if (line.startsWith("|") && lines[i + 1]?.trim().startsWith("|")) {
      const headers = cells(line),
        separator = cells(lines[i + 1]);
      if (
        headers.length >= 2 &&
        headers.length <= 6 &&
        separator.length === headers.length &&
        separator.every((c) => /^:?-{3,}:?$/.test(c))
      ) {
        let end = i + 2;
        const rows: string[][] = [];
        while (end < lines.length && lines[end].trim().startsWith("|")) {
          const row = cells(lines[end]);
          if (row.length !== headers.length) break;
          rows.push(row);
          end++;
        }
        // Never silently discard an incomplete/malformed table or its remaining lines.
        if (rows.length && !lines[end]?.trim().startsWith("|")) {
          flush();
          blocks.push({ type: "table", headers, rows });
          i = end - 1;
          continue;
        }
      }
    }
    if (!line) {
      flush();
      continue;
    }
    if (bullet.test(line) || /^Fig\.?\s*\d/i.test(line)) flush();
    paragraph += (paragraph ? " " : "") + line;
  }
  flush();
  return blocks.length ? blocks : [{ type: "paragraph", text: "—" }];
}
