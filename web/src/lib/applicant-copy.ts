import type { Locale } from "./domain";

export function privacyNotice(text: string, locale: Locale) {
  if (
    !/prueba interna|datos ficticios|internal test|fictitious|test parameters|no official validity/i.test(
      text,
    )
  )
    return text;
  return locale === "es"
    ? "La información presentada se utiliza para gestionar y evaluar su postulación ante el Galápagos Life Fund."
    : "The information you provide is used to manage and evaluate your application to Galápagos Life Fund.";
}

export function submissionConfirmation(
  stage: number,
  title: string | undefined,
  submittedAt: string,
  locale: Locale,
) {
  const es = locale === "es";
  const date = new Date(submittedAt);
  const day = new Intl.DateTimeFormat(es ? "es-EC" : "en-GB", {
    timeZone: "Pacific/Galapagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Pacific/Galapagos",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const project = title?.trim()
    ? `«${title.trim()}»`
    : es
      ? "registrado en este envío"
      : "recorded in this submission";
  return es
    ? `Usted presentó su ${stage === 1 ? "nota conceptual" : "propuesta completa"} para el proyecto ${project} el ${day}, a las ${time} (hora de Galápagos).`
    : `You submitted your ${stage === 1 ? "concept note" : "full proposal"} for the project ${project} on ${day} at ${time} (Galapagos time).`;
}

export function submissionPhase(stage: number, locale: Locale) {
  return locale === "es"
    ? `Fase ${stage} (${stage === 1 ? "Presentación de nota conceptual" : "Presentación de propuesta completa"})`
    : `Phase ${stage} (${stage === 1 ? "Concept note submission" : "Full proposal submission"})`;
}
