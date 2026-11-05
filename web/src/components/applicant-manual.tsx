"use client";
import { ManualView } from "./manual-view";
import {
  manualChapters,
  manualFormSteps,
  manualUpdatedDate,
} from "@/lib/applicant-manual";
import type { ManualGuide } from "@/lib/manual-types";
import type { Locale } from "@/lib/domain";
const guide: ManualGuide = {
  title: ["Manual de uso", "User manual"],
  kicker: ["GUÍA DEL APLICANTE", "APPLICANT GUIDE"],
  headline: ["Su proyecto, paso a paso.", "Your project, step by step."],
  lead: [
    "Guía de los seis pasos de la nota conceptual, sus documentos y anexos, y de la propuesta completa cuando GLF la habilite. Conozca qué completar, qué revisar y qué ocurre después de cada acción.",
    "A guide to the six concept-note steps, documents and attachments, and the full proposal when enabled by GLF. Learn what to complete, what to check and what happens after each action.",
  ],
  audience: ["Usuario externo", "External applicant"],
  updated: manualUpdatedDate,
  journey: manualFormSteps,
  icons: ["user", "book", "wallet", "checks", "file", "send"],
  chapters: manualChapters,
  backLabel: ["Ir a mis postulaciones", "Go to my applications"],
  empty: [
    "No encontramos ese término. Pruebe con «firma», «objetivo», «correo» o «borrador».",
    "No matches found. Try ‘signature’, ‘objective’, ‘email’ or ‘draft’.",
  ],
};
export function ApplicantManual({ locale }: { locale: Locale }) {
  return (
    <ManualView
      locale={locale}
      guide={guide}
      backHref="/applicant/applications"
    />
  );
}
