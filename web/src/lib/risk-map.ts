import { riskScore, riskLevel, type Payload } from "./domain";
export const riskMapColors = {
  low: [0.83, 0.94, 0.87],
  medium: [1, 0.94, 0.68],
  high: [1, 0.82, 0.62],
  very_high: [0.98, 0.7, 0.7],
  incomplete: [0.94, 0.94, 0.94],
} as const;
export function riskMapEntries(payload: Payload, residual = false) {
  return payload.activities.flatMap((activity, ai) =>
    activity.risks.map((risk, ri) => {
      const probability = residual
        ? risk.residual_probability
        : risk.probability;
      const severity = residual ? risk.residual_severity : risk.severity;
      const score = riskScore(probability, severity);
      return {
        activity,
        ai,
        risk,
        ri,
        probability,
        severity,
        score,
        level: riskLevel(score),
        code: `${ai + 1}.${ri + 1}`,
      };
    }),
  );
}
