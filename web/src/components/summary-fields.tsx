"use client";
import { useId } from "react";
import { words, type Locale } from "@/lib/domain";
import { RequiredMark } from "./required-mark";

export function SummaryFields({
  value,
  limit,
  locale,
  invalid,
  onChange,
}: {
  value: string;
  limit: number;
  locale: Locale;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const es = locale === "es";
  const total = words(value);
  const overLimit = total > limit;
  return (
    <section
      className="activity-card unified-summary"
      data-validation-field="summary"
    >
      <h3 id={`${id}-label`}>
        {es ? "Resumen del proyecto" : "Project summary"}
        <RequiredMark locale={locale} />
      </h3>
      <div className="field-help" id={`${id}-help`}>
        <p>
          {es
            ? `Describa brevemente el proyecto propuesto en un máximo de ${limit} palabras. Debe incluir:`
            : `Briefly describe the proposed project in no more than ${limit} words. Include:`}
        </p>
        <ul>
          {(es
            ? [
                "Contexto del proyecto.",
                "Problema a solucionar y las amenazas o presiones.",
                "Justificación.",
                "Solución propuesta y sus principales resultados esperados.",
              ]
            : [
                "Project context.",
                "The problem to address and the threats or pressures.",
                "Rationale.",
                "The proposed solution and its main expected results.",
              ]
          ).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          {es
            ? "Si su proyecto se solapa o duplica actividades de un proyecto anterior o en curso financiado por el Fondo u otro donante, asegúrese de indicar aquí por qué su proyecto es diferente y/o necesario. De lo contrario, la propuesta será automáticamente rechazada."
            : "If your project overlaps with or duplicates activities of a previous or ongoing project funded by the Fund or another donor, explain here why your project is different and/or necessary. Otherwise, the proposal will be automatically rejected."}
        </p>
        <p>
          {es
            ? "Si el proyecto forma parte de una propuesta coordinada a varios donantes simultáneamente, deberá indicarse."
            : "If the project is part of a coordinated proposal submitted to several donors simultaneously, state this here."}
        </p>
      </div>
      <textarea
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help ${id}-count${overLimit ? ` ${id}-error` : ""}`}
        aria-required="true"
        aria-invalid={invalid || overLimit}
        rows={10}
        maxLength={12000}
        spellCheck
        lang={locale}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="summary-counter-row">
        <small id={`${id}-count`} aria-live="polite">
          {total} / {limit} {es ? "palabras" : "words"}
        </small>
      </div>
      {overLimit && (
        <small className="danger-text" id={`${id}-error`} role="alert">
          {es
            ? `El resumen supera el límite de ${limit} palabras. Reduzca el texto antes de continuar; puede guardar el borrador.`
            : `The summary exceeds the ${limit}-word limit. Shorten it before continuing; you can save the draft.`}
        </small>
      )}
    </section>
  );
}
