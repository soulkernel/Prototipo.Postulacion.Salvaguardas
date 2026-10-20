import {
  identificationIssues,
  projectDateErrors,
} from "./applicant-validation";
import { budgetIssues } from "./budget";
import { z } from "zod";
import { normalizePhone } from "./phone";
import { geographyIssues } from "./geography";
import { projectSummary } from "./summary";
import {
  financialErrors,
  validateComplete,
  words,
  type Payload,
  type Rules,
  type Call,
} from "./domain";
import { identityFieldsForStage, narrativeFields } from "./fields";
import { alignmentIssues } from "./strategic-alignment";
import { potentialRiskIssues } from "./potential-risks";
import { partnerIssues } from "./partners";
import { activityPlanningIssues } from "./activity-planning";
import { resultIssues } from "./project-results";
import { applicationTopicIssue } from "./call-themes";
export function stepIssues(
  payload: Payload,
  rules: Rules,
  stage: number,
  step: number,
  phase2: Call["phase2_schema"] = [],
) {
  const missing: string[] = [];
  const invalid: string[] = [];
  if (step <= 1) {
    const keys =
      step === 0
        ? [
            "applicant_type",
            "category_id",
            ...identityFieldsForStage(stage).map((f) => f.key),
          ]
        : narrativeFields.map((f) => f.key);
    for (const key of keys) {
      if (["partners", "other_islands", "project_islands"].includes(key))
        continue;
      const value =
        key === "summary"
          ? projectSummary(payload.concept)
          : payload.concept[key as keyof Payload["concept"]];
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && !value.trim())
      )
        missing.push(key);
    }
    if (step === 0) {
      if (applicationTopicIssue(payload.concept.project_type, rules))
        invalid.push("project_type");
      invalid.push(...identificationIssues(payload.concept));
      invalid.push(...Object.keys(projectDateErrors(payload.concept, rules)));
      if (stage === 2)
        invalid.push(...budgetIssues(payload.budget, payload.concept));
      missing.push(...partnerIssues(payload.concept));
      missing.push(...geographyIssues(payload.concept));
      if (
        payload.concept.phone.trim() &&
        !normalizePhone(payload.concept.phone)
      )
        invalid.push("phone");
      if (
        payload.concept.email.trim() &&
        !z.email().safeParse(payload.concept.email).success
      )
        invalid.push("email");
      invalid.push(
        ...Object.keys(financialErrors(payload.concept, rules, stage)),
      );
    } else {
      missing.push(...resultIssues(payload.concept, stage));
      missing.push(...activityPlanningIssues(payload));
      missing.push(
        ...potentialRiskIssues(payload).filter(
          (k) => !k.startsWith("risk_") && !k.startsWith("activity_"),
        ),
      );
      missing.push(...alignmentIssues(payload.concept.strategic_alignment));
      if (words(projectSummary(payload.concept)) > rules.summary_word_limit)
        invalid.push("summary");
      if (stage === 2)
        for (const f of phase2)
          if (f.required && !payload.phase2[f.id]?.trim())
            missing.push("phase2:" + f.id);
    }
  } else if (step === 2) {
    missing.push(
      ...validateComplete(payload, rules, stage).filter(
        (k) =>
          k === "activities" ||
          (!k.startsWith("activity_dates_") &&
            /^(risk|quarters|activity|no_risks_reason)_/.test(k)),
      ),
    );
  }
  return { missing: [...new Set(missing)], invalid: [...new Set(invalid)] };
}
