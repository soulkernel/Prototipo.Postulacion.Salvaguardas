import type { Payload } from "./domain";
export type PotentialRisk = NonNullable<
  Payload["concept"]["risk_register"]
>[number];
export function riskCode(rows: PotentialRisk[], id: string) {
  const row = rows.find((r) => r.id === id);
  if (!row) return "";
  return (
    (row.dimension === "environmental" ? "RA-" : "RS-") +
    (rows
      .filter((r) => r.dimension === row.dimension)
      .findIndex((r) => r.id === id) +
      1)
  );
}
export function riskNarrative(
  rows: PotentialRisk[],
  dimension: PotentialRisk["dimension"],
) {
  return rows
    .filter((r) => r.dimension === dimension)
    .map((r) => `${riskCode(rows, r.id)}. ${r.name}`)
    .join("\n");
}
export function synchronizeRisks(payload: Payload): Payload {
  const rows = payload.concept.risk_register;
  if (!rows) return payload;
  return {
    ...payload,
    concept: {
      ...payload.concept,
      environmental_risks:
        riskNarrative(rows, "environmental") ||
        payload.concept.environmental_risks,
      social_risks:
        riskNarrative(rows, "social") || payload.concept.social_risks,
    },
    activities: payload.activities.map((a) => ({
      ...a,
      risks: a.risks.map((r) => {
        const source = rows.find((s) => s.id === r.source_id);
        return source
          ? { ...r, name: source.name, dimension: source.dimension }
          : r;
      }),
    })),
  };
}
export function potentialRiskIssues(payload: Payload) {
  const rows = payload.concept.risk_register;
  if (!rows) return [];
  const issues: string[] = [];
  rows.forEach((row) => {
    if (
      !payload.activities.some((a) =>
        a.risks.some((r) => r.source_id === row.id),
      )
    )
      issues.push("risk_unlinked");
  });
  if (
    new Set(rows.map((r) => r.id)).size !== rows.length ||
    rows.some((r) => !r.name.trim())
  )
    issues.push("potential_risks");
  for (const dimension of ["environmental", "social"] as const) {
    if (riskNarrative(rows, dimension).length > 12000)
      issues.push(dimension + "_risks");
  }
  payload.activities.forEach((a, ai) => {
    const ids = a.risks.map((r) => r.source_id).filter(Boolean);
    if (new Set(ids).size !== ids.length) issues.push("activity_" + (ai + 1));
    a.risks.forEach((r, ri) => {
      if (
        !r.source_id ||
        !rows.some(
          (s) =>
            s.id === r.source_id &&
            s.name === r.name &&
            s.dimension === r.dimension,
        )
      )
        issues.push(`risk_${ai + 1}_${ri + 1}`);
    });
  });
  return issues;
}
