"use client";
import { useState, type ReactNode } from "react";
import type { Locale, Payload } from "@/lib/domain";
import { MoneyInput } from "./money-input";
import { moneyEntryError } from "@/lib/money-input";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import {
  emptySummaryBudget,
  emptySummaryBudgetEntry,
  summaryBudgetCategories,
  summaryBudgetIssues,
  summaryBudgetMessage,
  summaryBudgetTotals,
  summaryEntryTotal,
  summaryUsd,
  type SummaryBudget,
  type SummaryBudgetEntry,
} from "@/lib/summary-budget";

function BudgetCard({
  initiallyOpen,
  children,
}: {
  initiallyOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details
      className="summary-budget-card"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      {children}
    </details>
  );
}

export function SummaryBudgetFields({
  payload,
  locale,
  onChange,
  onValidity,
  editGeneral,
  editActivities,
}: {
  payload: Payload;
  locale: Locale;
  onChange: (budget: SummaryBudget) => void;
  onValidity: (valid: boolean) => void;
  editGeneral: () => void;
  editActivities: () => void;
}) {
  const es = locale === "es";
  const b = payload.concept.summary_budget ?? emptySummaryBudget();
  const [invalid, setInvalid] = useState<Record<string, string>>({});
  const totals = summaryBudgetTotals(b);
  const expected =
    Math.round((payload.concept.requested_amount ?? 0) * 100) +
    Math.round((payload.concept.cofinance_amount ?? 0) * 100);
  const difference = expected - totals.total;
  const issues = summaryBudgetIssues(payload);
  const rows = payload.activities.map((activity) => ({
    activity,
    entry:
      b.entries.find((entry) => entry.activity_id === activity.id) ??
      emptySummaryBudgetEntry(activity.id),
  }));
  const update = (patch: Partial<SummaryBudget>) =>
    onChange({
      ...b,
      entries: [
        ...rows.map((row) => row.entry),
        ...b.entries.filter(
          (entry) =>
            !payload.activities.some(
              (activity) => activity.id === entry.activity_id,
            ),
        ),
      ],
      ...patch,
    });
  const updateEntry = (entry: SummaryBudgetEntry) =>
    update({
      entries: [
        ...rows.map((row) =>
          row.entry.activity_id === entry.activity_id ? entry : row.entry,
        ),
        ...b.entries.filter(
          (row) =>
            !payload.activities.some(
              (activity) => activity.id === row.activity_id,
            ),
        ),
      ],
    });
  const field = (
    id: string,
    label: string,
    value: number | null,
    change: (n: number | null) => void,
  ) => (
    <label className="editor-field" key={id}>
      <span>{label}</span>
      <MoneyInput
        id={id}
        value={value === null ? null : value / 100}
        locale={locale}
        invalid={
          id in invalid ||
          (id === "summary-administrative" &&
            issues.includes("summary_budget_admin_limit")) ||
          ((id.endsWith("-fees") || id === "summary-other-remuneration") &&
            issues.includes("summary_budget_remuneration_limit")) ||
          (id === "summary-sgas" &&
            issues.includes("summary_budget_sgas_subset"))
        }
        describedBy={
          id + "-help" + (issues.length ? " summary-budget-issues" : "")
        }
        onFocus={() => {}}
        onBlur={() => {}}
        onChange={(n) => change(n === null ? null : Math.round(n * 100))}
        onValidity={(valid, text) => {
          const next = { ...invalid };
          if (valid) delete next[id];
          else next[id] = text;
          setInvalid(next);
          onValidity(!Object.keys(next).length);
        }}
      />
      <small
        id={id + "-help"}
        className={id in invalid ? "field-warning" : undefined}
        role={id in invalid ? "alert" : undefined}
      >
        {id in invalid
          ? moneyEntryError(locale, invalid[id])
          : es
            ? "USD · Escriba 0 si no aplica"
            : "USD · Enter 0 if not applicable"}
      </small>
    </label>
  );
  return (
    <section
      id="summary-budget"
      className="summary-budget"
      data-validation-field="summary_budget"
    >
      <h2 className="application-section-title">
        {es ? "Presupuesto resumido" : "Summary budget"}
      </h2>
      <p>
        {es
          ? "Consulte las actividades registradas y estime su costo total por rubro, incluyendo GLF y cofinanciamiento. Esta es una estimación para la nota conceptual; el detalle se completará en la fase 2."
          : "Review registered activities and estimate their total cost by category, including GLF funding and cofinancing. This is a concept-note estimate; details will be completed in phase 2."}
      </p>
      <div
        className="summary-budget-overview"
        aria-label={
          es
            ? "Comparación con Información general"
            : "Comparison with General information"
        }
      >
        <div>
          <span>
            {es ? "Monto solicitado al GLF" : "Amount requested from GLF"}
          </span>
          <strong>
            {summaryUsd(
              Math.round((payload.concept.requested_amount ?? 0) * 100),
              locale,
            )}
          </strong>
        </div>
        <div>
          <span>{es ? "Cofinanciamiento" : "Cofinancing"}</span>
          <strong>
            {summaryUsd(
              Math.round((payload.concept.cofinance_amount ?? 0) * 100),
              locale,
            )}
          </strong>
        </div>
        <div>
          <span>
            {es
              ? "Costo total en Información general"
              : "Total cost in General information"}
          </span>
          <strong>{summaryUsd(expected, locale)}</strong>
        </div>
        <div>
          <span>{es ? "Total presupuestado" : "Budgeted total"}</span>
          <strong>{summaryUsd(totals.total, locale)}</strong>
        </div>
      </div>
      <p
        role="status"
        className={
          difference || issues.includes("summary_budget_reference")
            ? "summary-budget-warning"
            : "summary-budget-match"
        }
      >
        {issues.includes("summary_budget_reference")
          ? summaryBudgetMessage("summary_budget_reference", locale)
          : difference === 0
            ? es
              ? "Los totales coinciden con Información general."
              : "Totals match General information."
            : es
              ? `${difference > 0 ? "Faltan distribuir" : "El presupuesto excede en"} ${summaryUsd(Math.abs(difference), locale)} respecto al costo total de Información general.`
              : `${difference > 0 ? "Still to allocate" : "Budget exceeds the reference by"} ${summaryUsd(Math.abs(difference), locale)} compared with the total cost in General information.`}
      </p>
      <div className="summary-budget-links">
        <button
          type="button"
          className="button secondary"
          onClick={editGeneral}
        >
          {es
            ? "Revisar importes en Información general"
            : "Review amounts in General information"}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={editActivities}
        >
          {es
            ? "Editar actividades en Descripción del proyecto"
            : "Edit activities in Project description"}
        </button>
      </div>
      {!rows.length && (
        <p role="alert">
          {es
            ? "Primero agregue las actividades en Descripción del proyecto."
            : "First add activities in Project description."}
        </p>
      )}
      {rows.map(({ activity, entry }, index) => {
        const objectives =
          payload.concept.strategic_alignment?.objectives.filter((objective) =>
            activity.objective_ids?.includes(objective.id),
          ) ?? [];
        return (
          <BudgetCard
            key={activity.id}
            initiallyOpen={summaryBudgetCategories.some(
              ([key]) => entry[key] === null,
            )}
          >
            <summary>
              <span>
                {es ? "Actividad" : "Activity"} {index + 1}:{" "}
                {activity.title || (es ? "Sin nombre" : "Untitled")}
              </span>
              <strong>{summaryUsd(summaryEntryTotal(entry), locale)}</strong>
            </summary>
            <p>
              {es
                ? "Objetivos específicos asociados"
                : "Associated specific objectives"}
              :{" "}
              {objectives.map((objective) => objective.text).join(" · ") || "—"}
            </p>
            <div className="summary-budget-amounts">
              {summaryBudgetCategories.map(([key, esLabel, enLabel]) =>
                field(
                  `summary-${activity.id}-${key}`,
                  es ? esLabel : enLabel,
                  entry[key],
                  (n) => updateEntry({ ...entry, [key]: n }),
                ),
              )}
            </div>
          </BudgetCard>
        );
      })}
      {b.entries
        .filter(
          (entry) =>
            !payload.activities.some(
              (activity) => activity.id === entry.activity_id,
            ),
        )
        .map((entry) => (
          <div
            className="summary-budget-orphan"
            key={entry.activity_id}
            role="group"
            aria-label={
              es ? "Presupuesto sin actividad" : "Budget without activity"
            }
          >
            <p>
              {es
                ? "Actividad eliminada. Importe conservado para revisión"
                : "Deleted activity. Amount retained for review"}
              : <strong>{summaryUsd(summaryEntryTotal(entry), locale)}</strong>
            </p>
            <ConfirmRemoveButton
              locale={locale}
              element={
                es
                  ? "Importes de la actividad eliminada"
                  : "Deleted activity amounts"
              }
              consequence={
                es
                  ? "Se retirarán estos importes y el total del presupuesto se recalculará."
                  : "These amounts will be removed and the budget total recalculated."
              }
              aria-label={
                es
                  ? "Eliminar importes sin actividad"
                  : "Remove amounts without activity"
              }
              onConfirm={() => {
                const next = Object.fromEntries(
                  Object.entries(invalid).filter(
                    ([id]) => !id.startsWith(`summary-${entry.activity_id}-`),
                  ),
                );
                setInvalid(next);
                onValidity(!Object.keys(next).length);
                update({
                  entries: b.entries.filter(
                    (row) => row.activity_id !== entry.activity_id,
                  ),
                });
              }}
            />
          </div>
        ))}
      <section className="summary-budget-included">
        <h3>
          {es
            ? "Importes ya incluidos en los rubros anteriores"
            : "Amounts already included in the categories above"}
        </h3>
        <p>
          {es
            ? "Estos importes identifican componentes del presupuesto: no se suman otra vez. Honorarios debe incluir remuneraciones y salarios; declare abajo únicamente los pagos de ese tipo que estén incluidos en otros rubros."
            : "These amounts identify budget components and are not added again. Fees should include remuneration and salaries; below declare only such payments included in other categories."}
        </p>
        <div className="summary-budget-amounts">
          {field(
            "summary-administrative",
            es
              ? "Gastos administrativos incluidos"
              : "Included administrative costs",
            b.administrative,
            (n) => update({ administrative: n }),
          )}
          {field(
            "summary-other-remuneration",
            es
              ? "Otras remuneraciones incluidas fuera de Honorarios"
              : "Other remuneration included outside Fees",
            b.other_remuneration,
            (n) => update({ other_remuneration: n }),
          )}
          {field(
            "summary-sgas",
            es
              ? "Elaboración e implementación del SGAS incluidas"
              : "Included ESMS preparation and implementation",
            b.sgas,
            (n) => update({ sgas: n }),
          )}
        </div>
        <p>
          {es
            ? "Administración: máximo 10 % del costo total"
            : "Administration: maximum 10% of total cost"}
          : <strong>{summaryUsd(Math.floor(expected / 10), locale)}</strong>.{" "}
          {es
            ? "Remuneraciones, honorarios y salarios: máximo 30 % del monto GLF"
            : "Remuneration, fees and salaries: maximum 30% of GLF funding"}
          :{" "}
          <strong>
            {summaryUsd(
              Math.floor(
                (Math.round((payload.concept.requested_amount ?? 0) * 100) *
                  3) /
                  10,
              ),
              locale,
            )}
          </strong>
          .
        </p>
      </section>
      {!!issues.length && (
        <div
          id="summary-budget-issues"
          className="summary-budget-warning"
          role="alert"
        >
          <ul>
            {[
              ...new Set(
                issues.map((code) => summaryBudgetMessage(code, locale)),
              ),
            ].map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p>
            {es
              ? "Puede guardar el borrador incompleto. Corrija estas observaciones antes de preparar los documentos y enviar."
              : "You can save an incomplete draft. Resolve these issues before preparing documents and submitting."}
          </p>
        </div>
      )}
      <div
        className="concept-table-scroll"
        role="region"
        tabIndex={0}
        aria-label={
          es ? "Resumen calculado del presupuesto" : "Calculated budget summary"
        }
      >
        <table className="concept-review-table">
          <caption>
            {es
              ? "Resumen por actividad (USD) · Porcentajes sobre el total presupuestado"
              : "Activity summary (USD) · Percentages of the budgeted total"}
          </caption>
          <thead>
            <tr>
              <th scope="col">{es ? "Actividad" : "Activity"}</th>
              {summaryBudgetCategories.map(([key, sp, en]) => (
                <th scope="col" key={key}>
                  {es ? sp : en}
                </th>
              ))}
              <th scope="col">Total</th>
              <th scope="col">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ activity, entry }, i) => (
              <tr key={activity.id}>
                <th scope="row">
                  {i + 1}. {activity.title || "—"}
                </th>
                {summaryBudgetCategories.map(([key]) => (
                  <td key={key}>
                    {entry[key] === null
                      ? "—"
                      : summaryUsd(entry[key]!, locale)}
                  </td>
                ))}
                <td>{summaryUsd(summaryEntryTotal(entry), locale)}</td>
                <td>
                  {totals.total
                    ? (
                        (summaryEntryTotal(entry) / totals.total) *
                        100
                      ).toLocaleString(locale, { maximumFractionDigits: 1 })
                    : "0"}
                  %
                </td>
              </tr>
            ))}
            {b.entries
              .filter(
                (entry) =>
                  !payload.activities.some(
                    (activity) => activity.id === entry.activity_id,
                  ),
              )
              .map((entry) => (
                <tr key={entry.activity_id}>
                  <th scope="row">
                    {es
                      ? "Actividad eliminada · pendiente"
                      : "Deleted activity · pending"}
                  </th>
                  {summaryBudgetCategories.map(([key]) => (
                    <td key={key}>
                      {entry[key] === null
                        ? "—"
                        : summaryUsd(entry[key]!, locale)}
                    </td>
                  ))}
                  <td>{summaryUsd(summaryEntryTotal(entry), locale)}</td>
                  <td>
                    {totals.total
                      ? (
                          (summaryEntryTotal(entry) / totals.total) *
                          100
                        ).toLocaleString(locale, { maximumFractionDigits: 1 })
                      : "0"}
                    %
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              {summaryBudgetCategories.map(([key]) => (
                <td key={key}>{summaryUsd(totals.categories[key], locale)}</td>
              ))}
              <td>{summaryUsd(totals.total, locale)}</td>
              <td>{totals.total ? "100" : "0"}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
