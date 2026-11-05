import type { Locale, Concept } from "./domain";

export type DocumentMetadata = { format_version: number; author_name: string };
export const privacyNotice: Record<Locale, string> = {
  es: "CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS. Este documento puede contener datos personales. Su acceso, uso y comunicación deben limitarse a personas autorizadas y a las finalidades de gestión y evaluación de proyectos del GLF, conforme a la normativa aplicable. Utilice los canales oficiales autorizados. Imprima únicamente cuando sea necesario.",
  en: "CONFIDENTIALITY AND DATA PROTECTION. This document may contain personal data. Access, use and disclosure must be limited to authorized persons and the purposes of GLF project management and evaluation, in accordance with applicable regulations. Use authorized official channels. Print only when necessary.",
};
export function authorReference(
  name: string | undefined,
  date: string,
  revision: number,
  locale: Locale,
) {
  const initials = (name || "")
    .trim()
    .split(/\s+/u)
    .filter((w) => w && !/^(de|del|la|las|los|y|da|do)$/iu.test(w))
    .map((w) => Array.from(w)[0].toLocaleUpperCase(locale))
    .join("")
    .slice(0, 8);
  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "Pacific/Galapagos",
  }).format(new Date(date));
  return `${year} · ${initials || (locale === "es" ? "Autor no registrado" : "Author not recorded")} · v${revision}`;
}
export function proponentIdentification(
  concept: Pick<Concept, "applicant_type" | "ruc" | "identity_number">,
  locale: Locale,
) {
  const individual = concept.applicant_type === "individual";
  return {
    label: individual
      ? locale === "es"
        ? "Cédula del proponente"
        : "Applicant identity card"
      : locale === "es"
        ? "RUC de la organización"
        : "Organization RUC",
    value:
      (individual ? concept.identity_number : concept.ruc)?.trim() ||
      (locale === "es"
        ? "No registrado en esta versión"
        : "Not recorded in this version"),
  };
}
// Preserve the last line and avoid stretching short lines or individual long words.
export function justifiedWords(
  line: string,
  width: number,
  measure: (text: string) => number,
  size: number,
  last: boolean,
) {
  const words = line.trim().split(/\s+/u);
  if (last || words.length < 2 || /^\s*(?:[-•–]|\d+[.)])\s/u.test(line))
    return null;
  const spacing =
    (width - words.reduce((sum, w) => sum + measure(w), 0)) /
    (words.length - 1);
  if (spacing < 0 || spacing > size * 1.5) return null;
  let x = 0;
  return words.map((word) => {
    const item = { text: word, x };
    x += measure(word) + spacing;
    return item;
  });
}
