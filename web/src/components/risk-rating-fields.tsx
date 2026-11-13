"use client";
import { useId, type ReactNode } from "react";
import { riskLevel, riskScore, type Locale } from "@/lib/domain";
import { riskLevelLabel } from "@/lib/fields";
import {
  riskInterpretation,
  riskInterpretationKeys,
  riskVariableTone,
} from "@/lib/risk-interpretation";
import { RequiredMark } from "./required-mark";

type RatingField =
  "probability" | "severity" | "residual_probability" | "residual_severity";

export function RiskRatingField({
  label,
  field,
  value,
  locale,
  onChange,
}: {
  label: string;
  field: RatingField;
  value: number | null;
  locale: Locale;
  onChange: (value: number | null) => void;
}) {
  const id = useId(),
    es = locale === "es";
  const variable = field.includes("probability") ? "probability" : "severity";
  const definition = riskInterpretation(value, variable, locale);
  return (
    <div className="risk-rating-field">
      <label htmlFor={id}>
        <span className="field-label">
          {label}
          <RequiredMark locale={locale} />
        </span>
      </label>
      <select
        id={id}
        aria-required="true"
        aria-describedby={`${id}-meaning`}
        data-validation-field={field}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{es ? "Seleccione" : "Select"}</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n} ·{" "}
            {
              (es
                ? ["Muy baja", "Baja", "Media", "Alta", "Muy alta"]
                : ["Very low", "Low", "Medium", "High", "Very high"])[n - 1]
            }
          </option>
        ))}
      </select>
      <div
        id={`${id}-meaning`}
        className={`risk-scale-definition ${riskVariableTone(value)}`}
        data-risk-variable={variable}
        data-risk-value={value ?? ""}
        aria-live="polite"
        aria-atomic="true"
      >
        {definition ? (
          <>
            <strong>
              {es ? "Calificación seleccionada" : "Selected rating"}: {value}/5
            </strong>
            <p>{definition}</p>
          </>
        ) : (
          <p>
            {es
              ? "Seleccione un valor para consultar su significado."
              : "Select a rating to see its meaning."}
          </p>
        )}
      </div>
    </div>
  );
}

export function RiskInterpretationGuide({ locale }: { locale: Locale }) {
  const es = locale === "es";
  return (
    <details className="risk-interpretation-guide">
      <summary>
        {es
          ? "Consultar claves de calificación"
          : "View rating interpretation keys"}
      </summary>
      <p className="field-help">
        {es
          ? "Consulte los criterios de gravedad y probabilidad antes de calificar. Los colores acompañan el valor de cada variable; la categoría del riesgo se calcula combinando probabilidad y gravedad."
          : "Review severity and probability criteria before rating. Colors accompany each variable's rating; the risk category combines probability and severity."}
      </p>
      <ul className="risk-interpretation-list">
        {riskInterpretationKeys.map((row) => (
          <li
            key={row.value}
            className={`risk-interpretation-row ${riskVariableTone(row.value)}`}
          >
            <strong className="risk-key-value">
              {es ? "Calificación" : "Rating"}
              <br />
              <span>{row.value}/5</span>
            </strong>
            <div>
              <strong>{es ? "Gravedad" : "Severity"}</strong>
              <p>{row[locale].severity}</p>
            </div>
            <div>
              <strong>{es ? "Probabilidad" : "Probability"}</strong>
              <p>{row[locale].probability}</p>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function RiskCategoryResult({
  probability,
  severity,
  locale,
  residual = false,
  children,
}: {
  probability: number | null;
  severity: number | null;
  locale: Locale;
  residual?: boolean;
  children?: ReactNode;
}) {
  const es = locale === "es",
    score = riskScore(probability, severity);
  return (
    <div
      className={`risk-result risk-category-result ${riskLevel(score)}`}
      data-risk-category={residual ? "residual" : "initial"}
      aria-live="polite"
      aria-atomic="true"
    >
      <span>
        {residual
          ? es
            ? "Categoría del riesgo residual"
            : "Residual risk category"
          : es
            ? "Categoría del riesgo"
            : "Risk category"}
        :
      </span>
      <strong>{riskLevelLabel(score, locale)}</strong>
      <small>
        {es ? "Cálculo" : "Calculation"}: {probability ?? "—"} ×{" "}
        {severity ?? "—"} = {score ?? "—"}
      </small>
      {children}
    </div>
  );
}
