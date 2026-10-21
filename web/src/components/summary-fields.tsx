"use client";
import { useId } from "react";
import { words, type Locale } from "@/lib/domain";
import { RequiredMark } from "./required-mark";
import { proposalEntryPrompt } from "@/lib/proposal-guidance";
import { TextLimitCounter } from "./text-limit-counter";

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
      <h3 className="application-section-title" id={`${id}-label`}>
        {es ? "Resumen del proyecto" : "Project summary"}
        <RequiredMark locale={locale} />
      </h3>
      <div className="field-help summary-guidance" id={`${id}-help`}>
        <div className="summary-guidance-content">
          <div className="summary-guidance-heading">
            <h4>
              {es
                ? "Qué debe incluir el resumen"
                : "What to include in the summary"}
            </h4>
            <span>
              {es ? `Máximo ${limit} palabras` : `Maximum ${limit} words`}
            </span>
          </div>
          <p>
            {es
              ? "Describa brevemente el proyecto propuesto e incluya:"
              : "Briefly describe the proposed project and include:"}
          </p>
          <ul className="summary-guidance-list">
            {(es
              ? [
                  [
                    "Contexto",
                    "dónde y en qué situación se desarrollará el proyecto.",
                  ],
                  [
                    "Problema",
                    "qué busca solucionar y cuáles son las amenazas o presiones.",
                  ],
                  [
                    "Justificación",
                    "por qué es necesario realizar el proyecto.",
                  ],
                  [
                    "Solución y resultados",
                    "qué propone hacer y cuáles son sus principales resultados esperados.",
                  ],
                ]
              : [
                  [
                    "Context",
                    "where the project will take place and the situation it addresses.",
                  ],
                  [
                    "Problem",
                    "the problem to address and the threats or pressures involved.",
                  ],
                  ["Rationale", "why the project is needed."],
                  [
                    "Solution and results",
                    "what you propose to do and the main results you expect.",
                  ],
                ]
            ).map(([label, description]) => (
              <li key={label}>
                <strong>{label}:</strong> {description}
              </li>
            ))}
          </ul>
        </div>
        <section
          className="summary-guidance-notices"
          aria-labelledby={`${id}-notices`}
        >
          <h4 id={`${id}-notices`}>
            {es
              ? "Información adicional que debe declarar, si corresponde"
              : "Additional information to declare, if applicable"}
          </h4>
          <ul className="summary-guidance-list">
            <li>
              <strong>
                {es
                  ? "Proyectos similares o actividades duplicadas:"
                  : "Similar projects or duplicated activities:"}
              </strong>{" "}
              {es
                ? "Si su proyecto se solapa o duplica actividades de un proyecto anterior o en curso financiado por el Fondo u otro donante, asegúrese de indicar aquí por qué su proyecto es diferente y/o necesario. De lo contrario, la propuesta será automáticamente rechazada."
                : "If your project overlaps with or duplicates activities of a previous or ongoing project funded by the Fund or another donor, explain here why your project is different and/or necessary. Otherwise, the proposal will be automatically rejected."}
            </li>
            <li>
              <strong>
                {es
                  ? "Participación de varios donantes:"
                  : "Several donors involved:"}
              </strong>{" "}
              {es
                ? "Si el proyecto forma parte de una propuesta coordinada a varios donantes simultáneamente, deberá indicarse."
                : "If the project is part of a coordinated proposal submitted to several donors simultaneously, state this here."}
            </li>
          </ul>
        </section>
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
        placeholder={proposalEntryPrompt("summary", locale)}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="summary-counter-row">
        <TextLimitCounter
          id={`${id}-count`}
          count={total}
          limit={limit}
          locale={locale}
          unit="words"
          live="polite"
        />
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
