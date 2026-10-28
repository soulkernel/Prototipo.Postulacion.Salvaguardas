import {
  emptySgasExperience,
  sgasSource,
  type SgasExperience,
} from "../src/lib/sgas-experience";
import type { Payload } from "../src/lib/domain";
export function completedSgas(): SgasExperience {
  return {
    ...emptySgasExperience(),
    manual_reviewed: false,
    exclusions_confirmed: false,
    human_rights_involved: false,
    international_standards: false,
    environmental_assessments: false,
    environmental_social_experts: false,
    gender_experts: false,
    internal_staff: false,
    external_staff: false,
    external_expertise: null,
  };
}
export function generatedSgasDocs(p: Payload) {
  return [
    { kind: "experience_capacity" },
    {
      id: crypto.randomUUID(),
      file_name: "QA-SGAS.pdf",
      created_at: "2026-10-21T12:00:00Z",
      kind: "sgas_experience",
      generation_source: sgasSource(p.concept),
      generated_locale: "es",
    },
  ];
}
