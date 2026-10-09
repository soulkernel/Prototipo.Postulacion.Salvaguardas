import { z } from "zod";
import { normalizePhone } from "./phone";
import { geographyIssues } from "./geography";
import { hasSummaryParts, summarySections, summaryText } from "./summary";
import {
  financialErrors,
  validateComplete,
  words,
  type Payload,
  type Rules,
  type Call,
} from "./domain";
import { identityFields, narrativeFields } from "./fields";
import { alignmentIssues } from "./strategic-alignment";
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
        ? ["applicant_type", "category_id", ...identityFields.map((f) => f.key)]
        : narrativeFields.map((f) => f.key);
    for (const key of keys) {
      if (["partners", "other_islands", "project_islands"].includes(key))
        continue;
      const value = payload.concept[key as keyof Payload["concept"]];
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && !value.trim())
      )
        missing.push(key);
    }
    if (step === 0) {
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
      invalid.push(...Object.keys(financialErrors(payload.concept, rules)));
    } else {
      missing.push(...alignmentIssues(payload.concept.strategic_alignment));
      if (hasSummaryParts(payload.concept.summary_parts))
        for (const section of summarySections)
          if (!payload.concept.summary_parts[section.key].trim())
            missing.push("summary:" + section.key);
      if (
        words(
          hasSummaryParts(payload.concept.summary_parts)
            ? summaryText(payload.concept.summary_parts)
            : payload.concept.summary,
        ) > rules.summary_word_limit
      )
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
          /^(risk|quarters|activity|no_risks_reason)_/.test(k),
      ),
    );
  }
  return { missing: [...new Set(missing)], invalid: [...new Set(invalid)] };
}
