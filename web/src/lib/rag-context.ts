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
export function riskQuery(
  risk: RagRisk,
  stage: number,
  method: string,
  purpose = "assessment",
) {
  const name = risk.name.trim().replace(/[.\s]+$/g, "");
  const description = risk.description.trim();
  const extra =
    description &&
    description.replace(/[.\s]+$/g, "").toLowerCase() !==
      name.replace(/[.\s]+$/g, "").toLowerCase()
      ? ` ${description}`
      : "";
  const context = `Riesgo ${risk.dimension === "environmental" ? "ambiental" : "social"}: ${name}.${extra} Actividad: ${risk.activity.trim().replace(/[.\s]+$/g, "")}.`;
  const question =
    method === "e5"
      ? ""
      : purpose === "exclusions"
        ? "¿Qué exclusiones del GLF podrían ser pertinentes? Distinga prohibiciones expresas y aspectos por verificar. "
        : stage === 1
          ? "¿Qué disposiciones del GLF orientan la identificación y evaluación inicial del siguiente riesgo en la nota conceptual? "
          : "¿Qué disposiciones orientan la evaluación y las medidas de mitigación de este riesgo en el PGAS? ";
  return (
    question +
    context.slice(0, (method === "e5" ? 1500 : 600) - question.length)
  );
}
