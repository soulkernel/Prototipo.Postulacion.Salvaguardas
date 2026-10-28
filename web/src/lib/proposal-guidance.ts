import type { Locale } from "./domain";
export const proposalTitles: Record<string, [string, string]> = {
  objectives: ["Objetivos del proyecto", "Objective/s"],
  beneficiaries: [
    "Beneficiarios y contribuciones a medios de vida",
    "Beneficiaries and contributions to livelihoods",
  ],
  results: [
    "Resultados e indicadores de impacto",
    "Outcomes and impact indicators",
  ],
  activities: ["Actividades", "Activities"],
  duration: [
    "Duración y principales fechas del proyecto",
    "Duration and principal project dates",
  ],
  sustainability: [
    "Sostenibilidad y replicabilidad",
    "Sustainability and replication",
  ],
  alignment: ["Alineación estratégica", "Strategic alignment"],
  monitoring: ["Seguimiento y evaluación", "Monitoring and evaluation"],
};
const guidance: Record<string, [string[], string[]]> = {
  objectives: [
    [
      "Indique el objetivo general del proyecto: qué problema o cuestión abordará y qué busca lograr.",
    ],
    [
      "State the general objective of the project: what problem or issue it will address and what it aims to achieve.",
    ],
  ],
  beneficiaries: [
    [
      "Identifique quién o qué se beneficiará del proyecto: especies, ecosistemas, personas, hogares u otros grupos.",
      "Explique cómo se beneficiarán y qué contribución se espera para sus medios de vida, cuando corresponda.",
    ],
    [
      "Identify who or what will benefit from this project, e.g. species, ecosystems, people, households or other groups.",
      "Explain how they will benefit and the expected contributions to livelihoods, where applicable.",
    ],
  ],
  results: [
    [
      "Describa los cambios que espera conseguir al finalizar el proyecto y lo que entregará: elementos físicos, materiales, infraestructura, formación o capacidades desarrolladas.",
      "Complete el indicador de impacto, la meta propuesta, su unidad de medida y la evidencia que permitirá comprobar cada resultado.",
    ],
    [
      "Describe the likely outcomes at project end and what will be delivered: physical items, materials or infrastructure, training or skills development.",
      "Complete the impact indicator, proposed target, unit of measure and evidence that will verify each result.",
    ],
  ],
  activities: [
    [
      "Enumere brevemente las principales actividades que realizará para ejecutar el proyecto y seleccione los objetivos específicos a los que contribuyen.",
      "En la descripción, explique si se basan en algún proyecto existente e indique las fases o períodos previstos. Puede añadir fechas preliminares con los calendarios.",
      "En el siguiente paso se usarán estas mismas actividades para identificar y calificar sus riesgos ambientales y sociales.",
    ],
    [
      "Briefly list the principal activities to implement the project and select the specific objectives they contribute to.",
      "In the description, explain whether they build upon existing projects and indicate the planned schedule or phases. You may add preliminary dates using the date pickers.",
      "The next step uses these same activities to identify and assess their environmental and social risks.",
    ],
  ],
  duration: [
    [
      "Indique las fechas de inicio y finalización del proyecto. La duración debe respetar el máximo de la categoría de subvención seleccionada.",
      "Describa el calendario o las fases en las actividades de Descripción del proyecto; sus fechas preliminares deben estar dentro de este período.",
    ],
    [
      "Enter the project start and end dates. Duration must respect the maximum for the selected grant category.",
      "Briefly indicate the schedule or phases in Activities under Project description; preliminary activity dates must fall within this period.",
    ],
  ],
  sustainability: [
    [
      "Explique cómo las actividades propuestas y sus beneficios se mantendrán a largo plazo y cómo podrían ampliarse o replicarse.",
      "Cuando corresponda, describa las actividades de seguimiento, las estrategias y cómo las personas u organizaciones involucradas se apropiarán del trabajo y le darán continuidad.",
    ],
    [
      "Explain how the proposed activities and their benefits will be sustained in the long term and may be scaled up or replicated.",
      "Where relevant, describe follow-up activities, strategies and how the people or organizations involved will take ownership and continue the work.",
    ],
  ],
  alignment: [
    [
      "Seleccione los objetivos del Plan Galápagos 2030 y los ODS (Objetivos de Desarrollo Sostenible) a los que contribuye el objetivo general de su proyecto. Si corresponde, agregue otro instrumento de planificación e indique su nombre y el objetivo con el que se alinea.",
    ],
    [
      "Select the objectives of Galapagos Plan 2030 and the SDGs (Sustainable Development Goals) to which your project's general objective contributes. If applicable, add another planning instrument and specify its name and the objective it aligns with.",
    ],
  ],
  monitoring: [
    [
      "En cada ficha, seleccione si evaluará el avance de una actividad o el logro de un resultado y escoja el registro que ya ingresó. Se mostrarán automáticamente sus objetivos específicos asociados.",
      "Indique qué observará o medirá (indicador propuesto) y cómo lo comprobará (estrategia y actividades de seguimiento). Complete al menos una ficha antes del envío; puede guardar un borrador incompleto. Las metas y el método detallado se completarán en el proyecto completo.",
    ],
    [
      "In each card, choose whether to assess progress of an activity or achievement of an outcome, then select the record already entered. Its associated specific objectives will be shown automatically.",
      "State what you will observe or measure (proposed indicator) and how you will check it (monitoring strategy and activities). Complete at least one card before submitting; incomplete drafts can be saved. Targets and the detailed method will be completed in the full proposal.",
    ],
  ],
};
export function proposalTitle(key: string, locale: Locale) {
  return proposalTitles[key][locale === "es" ? 0 : 1];
}
export function proposalGuidance(key: string, locale: Locale, stage = 1) {
  if (key === "results" && stage === 1)
    return locale === "es"
      ? [
          "Seleccione un objetivo específico y describa qué espera conseguir al finalizar el proyecto y qué entregará: elementos físicos, materiales, infraestructura, formación o desarrollo de capacidades, según corresponda. Puede agregar varios resultados para un mismo objetivo.",
        ]
      : [
          "Select a specific objective and describe the likely outcomes at project end and what will be delivered: physical items, materials or infrastructure, training or skills development, as applicable. You can add several results for the same objective.",
        ];
  return guidance[key]?.[locale === "es" ? 0 : 1] || [];
}

const entryPrompts: Record<string, [string, string]> = {
  summary: [
    "Escriba aquí el resumen de su proyecto.",
    "Write your project summary here.",
  ],
  objectives: [
    "Escriba aquí los objetivos de su proyecto.",
    "Write your project objectives here.",
  ],
  beneficiaries: [
    "Describa quiénes se beneficiarán y de qué manera.",
    "Describe who or what will benefit and how.",
  ],
  results: [
    "Describa los resultados que espera lograr y cómo los comprobará.",
    "Describe the expected outcomes and how you will verify them.",
  ],
  sustainability: [
    "Explique cómo se mantendrán los beneficios del proyecto y cómo podría replicarse.",
    "Explain how project benefits will be sustained and how the project could be replicated.",
  ],
  alignment: [
    "Describa con qué instrumentos de planificación se alinea el proyecto.",
    "Describe which planning instruments the project aligns with.",
  ],
  monitoring: [
    "Describa cómo comprobará el avance y los resultados del proyecto.",
    "Describe how you will monitor project progress and results.",
  ],
  environmental_risks: [
    "Describa los riesgos ambientales que podría generar el proyecto.",
    "Describe the environmental risks the project could generate.",
  ],
  social_risks: [
    "Describa los riesgos sociales que podría generar el proyecto.",
    "Describe the social risks the project could generate.",
  ],
};

export function proposalEntryPrompt(key: string, locale: Locale) {
  return entryPrompts[key]?.[locale === "es" ? 0 : 1];
}
