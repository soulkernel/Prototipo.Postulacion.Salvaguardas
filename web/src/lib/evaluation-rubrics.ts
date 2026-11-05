export const evaluationVersion = "manual-glf-2025-v1";
export const reviewScale = [
  "Muy deficiente",
  "Deficiente",
  "Adecuado",
  "Bueno",
  "Muy bueno",
];
const concept = [
  [
    "1.1",
    "Pertinencia del proyecto",
    "Pertinencia del proyecto para abordar las prioridades nacionales y las prioridades del Fondo",
  ],
  [
    "1.2",
    "Pertinencia del proyecto",
    "¿La propuesta refleja y complementa con exactitud la situación actual de las actividades en el ámbito propuesto y no duplica otras iniciativas?",
  ],
  [
    "2.1",
    "Eficacia y viabilidad del proyecto",
    "¿Está claramente identificado el problema o la cuestión que abordará el proyecto?",
  ],
  [
    "2.2",
    "Eficacia y viabilidad del proyecto",
    "¿Es el proyecto realista y es probable que tenga los resultados/impactos esperados en el plazo previsto?",
  ],
  [
    "2.3",
    "Eficacia y viabilidad del proyecto",
    "¿Son las actividades propuestas prácticas y coherentes en relación con los objetivos, la finalidad y los resultados esperados?",
  ],
  [
    "2.4",
    "Eficacia y viabilidad del proyecto",
    "¿Hay una buena participación de las partes interesadas y los socios?",
  ],
  [
    "3.1",
    "Sostenibilidad del proyecto",
    "¿Es probable que el proyecto sea sostenible?",
  ],
  [
    "3.2",
    "Sostenibilidad del proyecto",
    "¿Existe la posibilidad de replicarlo o de ampliarlo?",
  ],
  [
    "4.1",
    "Presupuesto",
    "¿El presupuesto (incluida la cofinanciación) es adecuado para las actividades propuestas?",
  ],
  ["4.2", "Presupuesto", "¿El desglose del presupuesto es claro y realista?"],
];
const full = [
  [
    "1.1",
    "Capacidad de ejecución",
    "¿Capacidad de la organización o del individuo para ejecutar el proyecto propuesto?",
  ],
  [
    "1.2",
    "Capacidad de ejecución",
    "¿Experiencia de la organización o del individuo en proyectos similares?",
  ],
  [
    "2.1",
    "Objetivos y actividades del proyecto",
    "¿Está claramente definida la lógica del proyecto - es probable que las actividades alcancen los resultados y el objetivo?",
  ],
  [
    "2.2",
    "Objetivos y actividades del proyecto",
    "¿Están claramente definidas las actividades del proyecto y son realizables en el plazo establecido?",
  ],
  [
    "2.3",
    "Objetivos y actividades del proyecto",
    "¿Se han identificado los riesgos y se han mitigado eficazmente?",
  ],
  [
    "2.4",
    "Objetivos y actividades del proyecto",
    "¿Están claramente definidos los indicadores y los medios de seguimiento de los avances con respecto a los indicadores?",
  ],
  [
    "2.5",
    "Objetivos y actividades del proyecto",
    "¿Están claramente definidos los medios por los que se mantendrán y reproducirán las intervenciones del proyecto?",
  ],
  [
    "3.1",
    "Presupuesto",
    "¿Están claramente identificadas y son realistas las contribuciones del proponente y de los cofinanciadores?",
  ],
  [
    "3.2",
    "Presupuesto",
    "¿Es claro y realista el desglose del presupuesto por actividades?",
  ],
  [
    "3.3",
    "Presupuesto",
    "¿Es apropiado el desglose del presupuesto por categorías y es probable que sea rentable?",
  ],
  [
    "4.1",
    "PGAS y salvaguardas",
    "¿Son claros y realistas los instrumentos de salvaguardas y el Plan de Gestión Ambiental y Social (PGAS)?",
  ],
];
export function rubric(stage: number) {
  return (stage === 1 ? concept : full).map(([id, group, text]) => ({
    id,
    group,
    text,
    max: 5,
  }));
}
export function individualTotal(
  stage: number,
  scores: Record<string, number | null>,
) {
  const criteria = rubric(stage);
  const valid = Object.entries(scores).every(
    ([id, n]) =>
      criteria.some((c) => c.id === id) &&
      (n === null || (Number.isInteger(n) && n >= 1 && n <= 5)),
  );
  if (!valid) throw new Error("Invalid rubric scores");
  const answered = criteria.filter(
    (c) => scores[c.id] !== null && scores[c.id] !== undefined,
  );
  return {
    complete: answered.length === criteria.length,
    answered: answered.length,
    max: criteria.length * 5,
    total:
      answered.length === criteria.length
        ? criteria.reduce((s, c) => s + scores[c.id]!, 0)
        : null,
    partial: answered.reduce((s, c) => s + scores[c.id]!, 0),
  };
}
export function draftAverage(
  stage: number,
  rows: { scores: Record<string, number | null>; abstained?: boolean }[],
) {
  const values = rows
    .filter((r) => !r.abstained)
    .map((r) => individualTotal(stage, r.scores));
  const complete = values.filter((r) => r.complete);
  const sum = complete.reduce((s, r) => s + r.total!, 0);
  return {
    mean: complete.length ? sum / complete.length : null,
    below25: complete.length ? sum < 25 * complete.length : null,
    pending: values.length - complete.length,
    definitive: false,
  };
}
export function administrativeChecklist(stage: number) {
  const items =
    stage === 1
      ? [
          [
            "eligibility",
            "Admisibilidad",
            "¿Es elegible el solicitante y la propuesta en esta ronda?",
          ],
          [
            "category",
            "Admisibilidad",
            "¿Coincide la propuesta con las categorías de subvención del GLF?",
          ],
          [
            "screening",
            "Admisibilidad",
            "¿El solicitante realizó el Examen Ambiental y Social y las actividades descritas en su nota conceptual no son parte de la Lista de exclusiones del GLF?",
          ],
          [
            "deadline",
            "Presentación completa",
            "¿Se ha presentado la nota conceptual antes de la fecha límite?",
          ],
          [
            "experience",
            "Presentación completa",
            "¿Se incluye la información de referencia requerida (si se trata de una organización) o el CV (si se trata de una persona)?",
          ],
          [
            "budget",
            "Presentación completa",
            "¿Se incluye el presupuesto detallado?",
          ],
          [
            "cofinance",
            "Presentación completa",
            "¿Se proporciona una cofinanciación indicativa a un nivel que se ajuste a la solicitud de subvención del Fondo (grandes proyectos); hay al menos alguna cofinanciación (pequeños proyectos)?",
          ],
          [
            "format",
            "Formato del proyecto",
            "¿Se presenta la nota conceptual en el formato correcto (utilizando la plantilla facilitada)?",
          ],
        ]
      : [
          [
            "eligibility",
            "Elegibilidad",
            "Elegibilidad (comprobada en la fase de concepción)",
          ],
          [
            "deadline",
            "Presentación completa",
            "¿Se ha presentado la propuesta completa durante el plazo establecido?",
          ],
          [
            "instruments",
            "Presentación completa",
            "¿Se incluyen las versiones preliminares requeridas del PGAS y de las salvaguardas (anexos)?",
          ],
          [
            "experience",
            "Presentación completa",
            "¿Se incluye la información de referencia requerida (si se trata de una organización) o el CV (si se trata de una persona) (anexo)?",
          ],
          [
            "budget",
            "Presentación completa",
            "¿Se incluye el presupuesto desglosado?",
          ],
          [
            "cofinance",
            "Presentación completa",
            "¿Se proporciona una cofinanciación indicativa a un nivel que se ajuste a la solicitud de subvención del Fondo?",
          ],
          [
            "format",
            "Formato del proyecto",
            "¿Se presenta la propuesta completa en el formato correcto (utilizando la plantilla facilitada)?",
          ],
        ];
  return items.map(([id, group, text], i) => ({
    id,
    group,
    text,
    sourceItem:
      stage === 1 ? [1, 2, 3, 3, 4, 5, 6, 7][i] : ["Si", 1, 2, 3, 3, 4, 5][i],
  }));
}
