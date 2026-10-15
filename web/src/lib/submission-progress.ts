import { stepIssues } from "./step-validation";
import {
  validateComplete,
  type Payload,
  type Rules,
  type Call,
} from "./domain";
function blank(value: unknown, key = ""): unknown {
  if (
    [
      "id",
      "source_id",
      "catalog_id",
      "kind",
      "dimension",
      "objective_ids",
    ].includes(key)
  )
    return value;
  if (Array.isArray(value)) return value.map((v) => blank(v));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, blank(v, k)]),
    );
  if (typeof value === "string") return "";
  if (typeof value === "number") return null;
  if (typeof value === "boolean") return false;
  return value;
}
export function submissionProgress(
  payload: Payload,
  rules: Rules,
  stage: number,
  phase2: Call["phase2_schema"],
  documents: { kind: string }[],
  signedReady: boolean,
  _saved: boolean,
) {
  void _saved;
  const applicable = (p: Payload) => {
    const copy = structuredClone(p);
    if (copy.concept.strategic_alignment) {
      copy.concept.objectives = "structured";
      copy.concept.alignment = "structured";
    }
    if (copy.concept.project_results !== undefined)
      copy.concept.results = "structured";
    if (copy.concept.associated_organizations !== undefined)
      copy.concept.partners = "";
    if (copy.concept.risk_register !== undefined) {
      copy.concept.environmental_risks = "structured";
      copy.concept.social_risks = "structured";
    }
    return copy;
  };
  const issues = (raw: Payload) => {
    const p = applicable(raw);
    return new Set([
      ...validateComplete(p, rules, stage),
      ...[0, 1, 2].flatMap((i) => {
        const s = stepIssues(p, rules, stage, i, phase2);
        return [...s.missing, ...s.invalid];
      }),
    ]);
  };
  const pending = issues(payload),
    expected = issues(blank(payload) as Payload);
  pending.forEach((k) => expected.add(k));
  const required = new Set([
    ...rules.required_attachments,
    ...(stage === 1 ? ["concept_signed", "matrix_signed"] : []),
  ]);
  const missingDocs = [...required].filter(
    (k) =>
      !documents.some((d) => d.kind === k) ||
      (stage === 1 &&
        ["concept_signed", "matrix_signed"].includes(k) &&
        !signedReady),
  ).length;
  const total = expected.size + required.size;
  const completed = Math.max(0, total - pending.size - missingDocs);
  return {
    total,
    completed,
    percent: Math.min(100, Math.floor((completed * 100) / total)),
  };
}
