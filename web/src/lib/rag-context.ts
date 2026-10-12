import { riskLevel, riskScore, type Payload } from "./domain";
import { riskLabel } from "./potential-risks";

export type RagRisk = {
  id: string;
  label: string;
  name: string;
  description: string;
  activity: string;
  dimension: string;
  probability: number | null;
  severity: number | null;
  score: number | null;
  level: string;
};
export type RagProject = {
  id: string;
  reference: string;
  title: string;
  callId: string;
  revision: number;
  stage: number;
  risks: RagRisk[];
};
export function projectRisks(payload: Payload, locale: "es" | "en"): RagRisk[] {
  return (payload.activities || []).flatMap((activity, ai) =>
    (activity.risks || []).map((risk, ri) => ({
      id: risk.id,
      label:
        risk.source_id &&
        payload.concept.risk_register?.some((r) => r.id === risk.source_id)
          ? riskLabel(payload.concept.risk_register, risk.source_id, locale)
          : `${locale === "es" ? "Actividad" : "Activity"} ${ai + 1} · ${locale === "es" ? "Riesgo" : "Risk"} ${ri + 1}`,
      name: risk.name,
      description: risk.description,
      activity: activity.title,
      dimension: risk.dimension,
      probability: risk.probability,
      severity: risk.severity,
      score: riskScore(risk.probability, risk.severity),
      level: riskLevel(riskScore(risk.probability, risk.severity)),
    })),
  );
}
export function riskQuery(risk: RagRisk, stage: number, method: string) {
  const context = `Actividad: ${risk.activity}. Riesgo ${risk.dimension === "environmental" ? "ambiental" : "social"}: ${risk.name}. ${risk.description}`;
  const question =
    method === "e5"
      ? ""
      : stage === 1
        ? "¿Qué criterios normativos permiten revisar la identificación y evaluación de este riesgo, incluidas posibles exclusiones? "
        : "¿Qué criterios normativos y medidas de mitigación deben revisarse para este riesgo en el PGAS? ";
  return (
    question +
    context.slice(0, (method === "e5" ? 1500 : 600) - question.length)
  );
}
