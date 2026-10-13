import type { RagProject } from "./rag-context";
// Synthetic scenarios contain no applicant identity, contact or institutional dossier.
export function evaluationProjects(es: boolean): RagProject[] {
  return [
    {
      id: "00000000-0000-4000-9000-000000000031",
      callId: "academic",
      reference: "EVAL-001",
      revision: 1,
      stage: 1,
      title: es
        ? "Educación y conservación marina comunitaria"
        : "Community marine education and conservation",
      risks: [
        {
          id: "00000000-0000-4000-9000-000000000041",
          label: es
            ? "RAM-1 (Riesgo ambiental 1)"
            : "ENV-1 (Environmental risk 1)",
          name: es
            ? "Perturbación de fauna costera"
            : "Disturbance of coastal wildlife",
          description: es
            ? "Las jornadas educativas en la costa podrían acercar grupos de visitantes a zonas de anidación y descanso de fauna."
            : "Coastal educational visits may bring groups close to wildlife nesting and resting areas.",
          activity: es
            ? "Realizar jornadas de educación marina en zonas costeras"
            : "Conduct coastal marine education visits",
          dimension: "environmental",
          probability: 3,
          severity: 3,
          score: 9,
          level: "medium",
        },
        {
          id: "00000000-0000-4000-9000-000000000042",
          label: es ? "RSC-1 (Riesgo social 1)" : "SOC-1 (Social risk 1)",
          name: es ? "Participación desigual" : "Unequal participation",
          description: es
            ? "Los horarios y las barreras de acceso podrían limitar la participación de mujeres y de personas con discapacidad."
            : "Schedules and access barriers may limit participation by women and persons with disabilities.",
          activity: es
            ? "Organizar talleres comunitarios"
            : "Organize community workshops",
          dimension: "social",
          probability: 3,
          severity: 2,
          score: 6,
          level: "medium",
        },
      ],
    },
    {
      id: "00000000-0000-4000-9000-000000000032",
      callId: "academic",
      reference: "EVAL-002",
      revision: 1,
      stage: 2,
      title: es
        ? "Recuperación de residuos en zonas marino-costeras"
        : "Marine and coastal waste recovery",
      risks: [
        {
          id: "00000000-0000-4000-9000-000000000043",
          label: es ? "RSC-1 (Riesgo social 1)" : "SOC-1 (Social risk 1)",
          name: es
            ? "Seguridad y salud del personal"
            : "Worker health and safety",
          description: es
            ? "La recolección y clasificación de residuos podría causar cortes, exposición a materiales contaminados y accidentes durante el transporte."
            : "Waste collection and sorting may cause cuts, exposure to contaminated material and transport accidents.",
          activity: es
            ? "Recolectar y clasificar residuos costeros"
            : "Collect and sort coastal waste",
          dimension: "social",
          probability: 4,
          severity: 3,
          score: 12,
          level: "high",
        },
      ],
    },
  ];
}
