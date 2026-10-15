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
      <p className="field-help" id={`${id}-help`}>
        {es
          ? "Describa el contexto, el problema y las amenazas que abordará, por qué es necesario intervenir, cuál es la solución propuesta y qué resultados espera lograr."
          : "Describe the context, the problem and threats to address, why intervention is needed, the proposed solution and the results you expect to achieve."}
      </p>
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
