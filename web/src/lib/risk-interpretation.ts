import type { Locale } from "./domain";

export type RiskVariable = "probability" | "severity";
// Transcribed from Ulf's ES/EN Table 3 supplied by the user. Keep the original
// wording, including the probability-4/5 distinction, until GLF confirms a change.
export const riskInterpretationKeys = [
  {
    value: 5,
    es: {
      severity:
        "De gran magnitud o extensión, significativo, duradero o permanente, irreversible, puede generar conflicto social.",
      probability: "El riesgo casi con toda seguridad se materializará.",
    },
    en: {
      severity:
        "Large in magnitude or extent, significant, long-lasting or permanent, irreversible, may generate social conflict.",
      probability: "The risk will almost certainly materialise.",
    },
  },
  {
    value: 4,
    es: {
      severity:
        "De magnitud media a grande, afectando a gran extensión del territorio, previsible, temporal y reversible.",
      probability: "El riesgo sin duda se materializará.",
    },
    en: {
      severity:
        "Of medium to large magnitude, affecting a large area of the territory, foreseeable, temporary and reversible.",
      probability: "The risk will certainly materialise.",
    },
  },
  {
    value: 3,
    es: {
      severity:
        "Específico del lugar, temporal, manejable, evitable – o mitigable mediante medidas conocidas y factibles.",
      probability: "Es probable que el riesgo se materialice",
    },
    en: {
      severity:
        "Site-specific, temporary, manageable, avoidable – or mitigable through known and feasible measures.",
      probability: "The risk is likely to materialise",
    },
  },
  {
    value: 2,
    es: {
      severity:
        "Muy limitado, fácilmente evitable o manejable, afectando a una zona o población muy limitada.",
      probability: "Es posible que el riesgo no se materialice.",
    },
    en: {
      severity:
        "Very limited, easily avoidable or manageable, affecting a very limited area or population.",
      probability: "It is possible that the risk will not materialise.",
    },
  },
  {
    value: 1,
    es: {
      severity: "Insignificante, mínimo o inexistente.",
      probability: "Es casi seguro que el riesgo no se materializará.",
    },
    en: {
      severity: "Negligible, minimal or non-existent.",
      probability: "It is almost certain that the risk will not materialise.",
    },
  },
] as const;

export function riskInterpretation(
  value: number | null,
  variable: RiskVariable,
  locale: Locale,
) {
  return (
    riskInterpretationKeys.find((row) => row.value === value)?.[locale][
      variable
    ] || ""
  );
}

// These colors describe a single 1–5 variable, not the combined 1–25 score.
// The combined category continues to use riskLevel(probability * severity).
export function riskVariableTone(value: number | null) {
  if (value === 1 || value === 2) return "low";
  if (value === 3) return "medium";
  if (value === 4) return "high";
  if (value === 5) return "very_high";
  return "incomplete";
}
