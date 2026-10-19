import type { Concept, Locale } from "./domain";
import { identityFields, narrativeFields } from "./fields";
import { callThemeLabel } from "./call-themes";
import { alignmentNarrative } from "./document-language";
import {
  generalOnlyAlignment,
  requiresObjectiveContribution,
} from "./strategic-alignment";
import { projectSummary } from "./summary";
import { resultUnits } from "./project-results";
import {
  currentConceptLayout,
  includesAdministrativeCost,
  type ConceptPresentation,
} from "./concept-layout";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };
export type ConceptSection = {
  id: string;
  title: string;
  introduction: string;
  blocks: ContentBlock[];
};

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

export function conceptSections(
  c: Concept,
  locale: Locale,
  rules?: unknown,
  presentation: ConceptPresentation = {
    stage: 1,
    layoutVersion: currentConceptLayout,
  },
): ConceptSection[] {
  const es = locale === "es";
  const table = (headers: string[], rows: string[][]): ContentBlock => ({
    type: "table",
    headers,
    rows,
  });
  const paragraphs = (text: string) => narrativeBlocks(text);
  const amount = (v: number | null) =>
    v == null
      ? es
        ? "No consignado"
        : "Not provided"
      : new Intl.NumberFormat(es ? "es-EC" : "en-US", {
          style: "currency",
          currency: "USD",
        }).format(v);
  const date = (v: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? new Intl.DateTimeFormat(es ? "es-EC" : "en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(v + "T12:00:00Z"))
      : v || "—";
  const value = (key: keyof Concept): string => {
    if (["requested_amount", "cofinance_amount", "admin_cost"].includes(key))
      return amount(c[key] as number | null);
    if (key === "start_date" || key === "end_date") return date(c[key]);
    if (key === "project_type")
      return callThemeLabel(c.project_type, rules, locale);
    if (key === "partners" && c.associated_organizations)
      return c.associated_organizations.join("; ") || "—";
    const v = c[key];
    return Array.isArray(v) ? v.join(", ") || "—" : String(v ?? "") || "—";
  };
  const details = identityFields
    .filter(
      (f) =>
        !["requested_amount", "cofinance_amount", "admin_cost"].includes(f.key),
    )
    .map((f) => [es ? f.es : f.en, value(f.key)]);
  const categories =
    rules &&
    typeof rules === "object" &&
    "categories" in rules &&
    Array.isArray(rules.categories)
      ? rules.categories
      : [];
  const selectedCategory = categories.find(
    (v: { id?: string }) => v?.id === c.category_id,
  );
  const categoryLabel =
    selectedCategory?.[es ? "label_es" : "label_en"] ||
    (
      {
        small: es ? "Pequeña" : "Small",
        medium: es ? "Mediana" : "Medium",
        large: es ? "Grande" : "Large",
      } as Record<string, string>
    )[c.category_id] ||
    c.category_id ||
    "—";
  details.splice(
    1,
    0,
    [
      es ? "Tipo de solicitante" : "Applicant type",
      c.applicant_type === "individual"
        ? es
          ? "Persona natural"
          : "Individual"
        : c.applicant_type === "organization"
          ? es
            ? "Organización"
            : "Organization"
          : "—",
    ],
    [es ? "Categoría de subvención" : "Grant category", categoryLabel],
  );
  for (const [key, label] of (c.applicant_type === "individual"
    ? [
        [
          "identity_number",
          es ? "Número de cédula de identidad" : "Identity card number",
        ],
        [
          "residence_number",
          es
            ? "Número de credencial de residencia permanente"
            : "Permanent residence card number",
        ],
      ]
    : [["ruc", es ? "RUC de la organización" : "Organization RUC"]]) as [
    keyof Concept,
    string,
  ][]) {
    if (c[key]) details.push([label, value(key)]);
  }
  const sections: ConceptSection[] = [
    {
      id: "general",
      title: es ? "Datos generales del proyecto" : "Project details",
      introduction: es
        ? "Estos datos identifican la propuesta, al proponente y a la persona de contacto. También indican dónde y durante qué período se prevé ejecutar el proyecto."
        : "These details identify the proposal, the applicant and the contact person, and describe where and when the project is expected to take place.",
      blocks: [
        table(
          es
            ? ["Dato", "Información presentada"]
            : ["Field", "Submitted information"],
          details,
        ),
      ],
    },
    {
      id: "financing",
      title: es ? "Financiamiento estimado" : "Estimated financing",
      introduction: es
        ? "El costo total estimado reúne el monto solicitado al GLF y el cofinanciamiento previsto. En esta fase se presentan estimaciones; el presupuesto detallado corresponde al proyecto completo."
        : "The estimated total combines the amount requested from GLF and planned cofinancing. These are preliminary estimates; the detailed budget belongs to the full proposal.",
      blocks: [
        table(es ? ["Concepto", "Monto"] : ["Item", "Amount"], [
          [
            es ? "Monto solicitado al GLF" : "Amount requested from GLF",
            amount(c.requested_amount),
          ],
          [es ? "Cofinanciamiento" : "Cofinancing", amount(c.cofinance_amount)],
          [
            es ? "Costo total estimado" : "Estimated total cost",
            c.requested_amount === null || c.cofinance_amount === null
              ? es
                ? "Pendiente de completar"
                : "Incomplete"
              : amount(c.requested_amount + c.cofinance_amount),
          ],
          ...(includesAdministrativeCost(presentation)
            ? [
                [
                  es
                    ? "Gastos administrativos incluidos en el costo"
                    : "Administrative expenses included in the cost",
                  amount(c.admin_cost),
                ],
              ]
            : []),
        ]),
      ],
    },
  ];
  const introductions: Record<string, [string, string]> = {
    summary: [
      "La descripción explica el contexto, el problema y la intervención propuesta, junto con los cambios que se espera lograr.",
      "The description explains the context, the problem and the proposed intervention, together with the changes it aims to achieve.",
    ],
    objectives: [
      "El objetivo general expresa el propósito del proyecto. Los objetivos específicos describen los logros que permitirán alcanzarlo.",
      "The general objective describes the project's purpose. The specific objectives set out the achievements that will support it.",
    ],
    beneficiaries: [
      "El proponente describe a quiénes beneficiaría la intervención y qué aportaría a sus medios de vida, a los ecosistemas o a las especies involucradas.",
      "The applicant describes who would benefit and how the intervention would support livelihoods, ecosystems or the species involved.",
    ],
    results: [
      "Esta sección presenta los cambios esperados y la información que permitiría comprobarlos. Las metas son preliminares y los detalles de medición se desarrollan en el proyecto completo.",
      "This section describes expected changes and the information that would help verify them. Targets are preliminary; detailed measurement is developed in the full proposal.",
    ],
    sustainability: [
      "Aquí se explica cómo podrían mantenerse los beneficios después del financiamiento y en qué condiciones la experiencia podría replicarse.",
      "This section explains how benefits could continue after funding ends and under what conditions the experience could be replicated.",
    ],
    alignment: [
      "La alineación relaciona el objetivo general con el Plan Galápagos 2030 y los Objetivos de Desarrollo Sostenible (ODS), e identifica la contribución esperada.",
      "Alignment connects the general objective with the Galapagos 2030 Plan and the Sustainable Development Goals (SDGs), and describes its expected contribution.",
    ],
    monitoring: [
      "El seguimiento propuesto explica cómo se observaría el avance de las actividades y qué señales permitirían valorar sus resultados. Es una previsión de la nota conceptual, no un reporte de ejecución.",
      "The proposed monitoring explains how activity progress would be observed and what evidence would help assess results. This is a concept-note proposal, not an implementation report.",
    ],
    environmental_risks: [
      "Se presentan los posibles efectos ambientales identificados por el proponente. Su valoración por actividad se detalla en la evaluación ambiental y social.",
      "These are the potential environmental effects identified by the applicant. Their activity-level assessment is detailed in the environmental and social evaluation.",
    ],
    social_risks: [
      "Se presentan los posibles efectos sociales identificados por el proponente. Su valoración por actividad se detalla en la evaluación ambiental y social.",
      "These are the potential social effects identified by the applicant. Their activity-level assessment is detailed in the environmental and social evaluation.",
    ],
  };
  for (const f of narrativeFields) {
    let blocks = paragraphs(String(c[f.key] ?? ""));
    if (f.key === "summary") blocks = paragraphs(projectSummary(c));
    if (f.key === "objectives" && c.strategic_alignment?.objectives.length) {
      let index = 0;
      blocks = c.strategic_alignment.objectives.flatMap((o) =>
        paragraphs(
          (o.kind === "general"
            ? es
              ? "Objetivo general: "
              : "General objective: "
            : (es ? "Objetivo específico " : "Specific objective ") +
              ++index +
              ": ") + o.text,
        ),
      );
    }
    if (f.key === "alignment" && c.strategic_alignment?.objectives.length)
      blocks = c.strategic_alignment.objectives
        .filter(
          (o) =>
            !generalOnlyAlignment(c.strategic_alignment!.version) ||
            o.kind === "general",
        )
        .flatMap((o) =>
          alignmentNarrative(
            generalOnlyAlignment(c.strategic_alignment!.version)
              ? { ...o, glf: [] }
              : o,
            locale,
            requiresObjectiveContribution(c.strategic_alignment!.version),
          ).flatMap(paragraphs),
        );
    if (f.key === "results" && c.project_results !== undefined)
      blocks = c.project_results.length
        ? c.project_results.flatMap((r, i) => {
            const objectives =
              c.strategic_alignment?.objectives.filter(
                (o) => o.kind === "specific",
              ) || [];
            const index = objectives.findIndex((o) => o.id === r.objective_id);
            const relation =
              index >= 0
                ? `${es ? "objetivo específico" : "specific objective"} ${index + 1}: «${objectives[index].text}»`
                : es
                  ? "un objetivo específico pendiente de identificar"
                  : "a specific objective yet to be identified";
            const unit =
              r.unit === "other"
                ? r.other_unit
                : resultUnits.find((u) => u[0] === r.unit)?.[es ? 1 : 2] || "";
            return [
              {
                type: "paragraph" as const,
                text: es
                  ? `Resultado ${i + 1}. Para contribuir al ${relation}, se propone el siguiente resultado y su forma de verificación.`
                  : `Result ${i + 1}. To support ${relation}, the following result and means of verification are proposed.`,
              },
              table(
                es
                  ? [
                      "Resultado esperado",
                      "Indicador",
                      "Meta preliminar",
                      "Evidencia prevista",
                    ]
                  : [
                      "Expected result",
                      "Indicator",
                      "Preliminary target",
                      "Planned evidence",
                    ],
                [
                  [
                    r.result || "—",
                    r.indicator || "—",
                    `${r.target ?? "—"} ${unit}`.trim(),
                    r.evidence || "—",
                  ],
                ],
              ),
            ];
          })
        : paragraphs("");
    if (
      (f.key === "environmental_risks" || f.key === "social_risks") &&
      c.risk_register
    ) {
      const rows = c.risk_register.filter(
        (r) =>
          r.dimension ===
          (f.key === "environmental_risks" ? "environmental" : "social"),
      );
      blocks = rows.length
        ? [
            table(
              es
                ? ["Referencia", "Riesgo identificado"]
                : ["Reference", "Identified risk"],
              rows.map((r, i) => [
                (f.key === "environmental_risks" ? "RA-" : "RS-") + (i + 1),
                r.name,
              ]),
            ),
          ]
        : paragraphs("");
    }
    sections.push({
      id: f.key,
      title: es ? f.es : f.en,
      introduction:
        f.key === "alignment" &&
        c.strategic_alignment &&
        !requiresObjectiveContribution(c.strategic_alignment.version)
          ? es
            ? "La alineación relaciona el objetivo general con el Plan Galápagos 2030 y los Objetivos de Desarrollo Sostenible (ODS). También presenta los otros instrumentos de planificación que el postulante haya añadido."
            : "Alignment connects the general objective with the Galapagos 2030 Plan and the Sustainable Development Goals (SDGs). It also presents any other planning instruments added by the applicant."
          : introductions[f.key]?.[es ? 0 : 1] || "",
      blocks,
    });
  }
  return sections;
}
