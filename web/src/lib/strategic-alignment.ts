import { z } from "zod";

export const alignmentVersion = "pg2030-anexo6-glf2024-ods2015-v1";
export const planSource =
  "https://unidosporgalapagos.wordpress.com/wp-content/uploads/2021/05/anexo-no.-6-alineacion-pg2030-con-planificacion-nacional-final-sc.pdf";
export const glfSource =
  "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2024/12/Manual-Subvenciones-GLF.pdf";
// Short interface labels. The source document retains the authoritative wording.
export const planAxes = [
  ["G", "Gobernanza", "Governance"],
  ["C", "Comunidad", "Community"],
  ["E", "Entorno", "Environment"],
  ["H", "Hábitat", "Habitat"],
  ["N", "Economía", "Economy"],
] as const;
export const planPolicies = [
  {
    id: "G1",
    es: "Administración pública del régimen especial",
    en: "Public administration under the special regime",
    ods: [3, 11, 13, 16, 17],
  },
  {
    id: "G2",
    es: "Coordinación y cooperación institucional",
    en: "Institutional coordination and cooperation",
    ods: [11, 13, 14, 16, 17],
  },
  {
    id: "G3",
    es: "Participación ciudadana y control social",
    en: "Citizen participation and social oversight",
    ods: [10, 11, 13, 16, 17],
  },
  {
    id: "G4",
    es: "Cooperación internacional y ciencia aplicada",
    en: "International cooperation and applied science",
    ods: [3, 4, 8, 9, 10, 11, 14, 16, 17],
  },
  {
    id: "C1",
    es: "Salud, calidad de vida y servicios públicos",
    en: "Health, quality of life and public services",
    ods: [1, 2, 3, 5, 6, 8, 10, 11, 14, 16],
  },
  {
    id: "C2",
    es: "Capacidades de residentes permanentes",
    en: "Permanent residents' capabilities",
    ods: [4, 8, 9, 10, 12, 13, 16, 17],
  },
  {
    id: "C3",
    es: "Identidad isleña vinculada al entorno natural",
    en: "Island identity linked to the natural environment",
    ods: [4, 6, 8, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: "E1",
    es: "Conservación de ecosistemas y biodiversidad",
    en: "Ecosystem and biodiversity conservation",
    ods: [6, 8, 9, 11, 12, 13, 14, 15, 16, 17],
  },
  {
    id: "E2",
    es: "Manejo y mitigación de presiones sobre el archipiélago",
    en: "Management and mitigation of pressures on the archipelago",
    ods: [6, 8, 9, 11, 12, 14, 15, 17],
  },
  {
    id: "E3",
    es: "Asentamientos que recuperan sus ecosistemas",
    en: "Settlements that restore their ecosystems",
    ods: [6, 7, 8, 9, 11, 12, 13],
  },
  {
    id: "H1",
    es: "Áreas urbanas y rurales sostenibles e inclusivas",
    en: "Sustainable, inclusive urban and rural areas",
    ods: [6, 8, 9, 10, 11, 12, 14, 15, 17],
  },
  {
    id: "H2",
    es: "Movilidad sostenible y acceso equitativo",
    en: "Sustainable mobility and equitable access",
    ods: [2, 3, 4, 7, 8, 9, 10, 11, 12, 15],
  },
  {
    id: "H3",
    es: "Energía sostenible y consumo responsable",
    en: "Sustainable energy and responsible consumption",
    ods: [7, 8, 9, 11, 12, 17],
  },
  {
    id: "H4",
    es: "Acceso a internet y herramientas tecnológicas",
    en: "Access to the internet and technology",
    ods: [4, 5, 8, 9, 11, 17],
  },
  {
    id: "N1",
    es: "Economía colaborativa y equitativa",
    en: "Collaborative and equitable economy",
    ods: [2, 6, 8, 9, 12, 14, 17],
  },
  {
    id: "N2",
    es: "Diversificación económica compatible con el patrimonio",
    en: "Economic diversification compatible with heritage",
    ods: [6, 8, 9, 10, 12, 13, 14, 17],
  },
  {
    id: "N3",
    es: "Conocimiento para diversificar la economía",
    en: "Knowledge for economic diversification",
    ods: [8, 9, 10, 12, 14, 17],
  },
];
export const sdgGoals = [
  ["Fin de la pobreza", "No poverty"],
  ["Hambre cero", "Zero hunger"],
  ["Salud y bienestar", "Good health and well-being"],
  ["Educación de calidad", "Quality education"],
  ["Igualdad de género", "Gender equality"],
  ["Agua limpia y saneamiento", "Clean water and sanitation"],
  ["Energía asequible y no contaminante", "Affordable and clean energy"],
  [
    "Trabajo decente y crecimiento económico",
    "Decent work and economic growth",
  ],
  [
    "Industria, innovación e infraestructura",
    "Industry, innovation and infrastructure",
  ],
  ["Reducción de las desigualdades", "Reduced inequalities"],
  ["Ciudades y comunidades sostenibles", "Sustainable cities and communities"],
  [
    "Producción y consumo responsables",
    "Responsible consumption and production",
  ],
  ["Acción por el clima", "Climate action"],
  ["Vida submarina", "Life below water"],
  ["Vida de ecosistemas terrestres", "Life on land"],
  [
    "Paz, justicia e instituciones sólidas",
    "Peace, justice and strong institutions",
  ],
  ["Alianzas para lograr los objetivos", "Partnerships for the goals"],
].map(([es, en], i) => ({ id: i + 1, es, en }));
export const glfLines = [
  [
    "Gestión y protección de reservas marinas",
    "Marine reserve management and protection",
  ],
  [
    "Compromisos de Sostenibilidad del acuerdo",
    "Agreement Sustainability Commitments",
  ],
  ["Pesca sostenible", "Sustainable fisheries"],
  ["Investigación científica y económica", "Scientific and economic research"],
  [
    "Educación, comunicación e interpretación",
    "Education, communication and interpretation",
  ],
  [
    "Turismo sostenible y economía azul",
    "Sustainable tourism and blue economy",
  ],
  [
    "Conservación y sostenibilidad de interés comunitario",
    "Community conservation and sustainability",
  ],
].map(([es, en], i) => ({ id: `GLF-L0${i + 1}`, es, en }));
const unique = <T>(values: T[]) => new Set(values).size === values.length;
export const objectiveSchema = z
  .object({
    id: z.uuid(),
    kind: z.enum(["general", "specific"]),
    text: z.string().max(2000),
    plan: z
      .array(z.enum(planPolicies.map((p) => p.id) as [string, ...string[]]))
      .max(17)
      .refine(unique),
    ods: z.array(z.number().int().min(1).max(17)).max(17).refine(unique),
    glf: z
      .array(z.enum(glfLines.map((p) => p.id) as [string, ...string[]]))
      .max(7)
      .refine(unique),
    contribution: z.string().max(600),
  })
  .strict();
export const strategicSchema = z
  .object({
    version: z.literal(alignmentVersion),
    legacy_text: z.string().max(24001).optional(),
    objectives: z.array(objectiveSchema).min(1).max(11),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      !unique(v.objectives.map((o) => o.id)) ||
      v.objectives.filter((o) => o.kind === "general").length !== 1
    )
      ctx.addIssue({
        code: "custom",
        message: "One general objective and unique identifiers are required",
      });
    if (Object.values(strategicText(v)).some((text) => text.length > 12000))
      ctx.addIssue({
        code: "custom",
        message: "Strategic alignment exceeds the document limit",
      });
  });
export type StrategicAlignment = z.infer<typeof strategicSchema>;
export type ProjectObjective = z.infer<typeof objectiveSchema>;
export function newObjective(kind: ProjectObjective["kind"]): ProjectObjective {
  return {
    id: crypto.randomUUID(),
    kind,
    text: "",
    plan: [],
    ods: [],
    glf: [],
    contribution: "",
  };
}
export function suggestedOds(policies: string[]) {
  return [
    ...new Set(
      planPolicies.filter((p) => policies.includes(p.id)).flatMap((p) => p.ods),
    ),
  ].sort((a, b) => a - b);
}
export function alignmentIssues(value: StrategicAlignment | undefined) {
  if (!value) return [];
  const issues: string[] = [];
  if (!value.objectives.some((o) => o.kind === "specific"))
    issues.push("objectives");
  if (value.objectives.some((o) => !o.text.trim())) issues.push("objectives");
  if (
    value.objectives.some(
      (o) =>
        !o.contribution.trim() ||
        !(o.plan.length || o.ods.length || o.glf.length),
    )
  )
    issues.push("alignment");
  if (
    ["plan", "ods", "glf"].some(
      (key) =>
        !value.objectives.some((o) => o[key as "plan" | "ods" | "glf"].length),
    )
  )
    issues.push("alignment");
  return [...new Set(issues)];
}
export function strategicText(
  value: StrategicAlignment,
  locale: "es" | "en" = "es",
) {
  let specific = 0;
  const objectives = value.objectives
    .map(
      (o) =>
        `${o.kind === "general" ? (locale === "es" ? "Objetivo general" : "General objective") : `OE${++specific}`}: ${o.text}`,
    )
    .join("\n\n");
  const alignment = value.objectives
    .map((o) => {
      const labels = (
        ids: string[],
        items: { id: string; es: string; en: string }[],
      ) =>
        ids
          .map(
            (id) => `${id}: ${items.find((p) => p.id === id)?.[locale] || id}`,
          )
          .join("; ");
      return `${o.text}\nPlan Galápagos 2030: ${labels(o.plan, planPolicies)}\nODS: ${o.ods.map((id) => `${id}: ${sdgGoals[id - 1]?.[locale] ?? id}`).join("; ")}\nGLF: ${labels(o.glf, glfLines)}\n${locale === "es" ? "Contribución esperada" : "Expected contribution"}: ${o.contribution}`;
    })
    .join("\n\n");
  return {
    objectives,
    alignment: `${locale === "es" ? "Referencias" : "References"}: ${value.version}\n${alignment}\n\nPlan: ${planSource}\nODS: https://sdgs.un.org/es/goals\nGLF: ${glfSource}`,
  };
}
