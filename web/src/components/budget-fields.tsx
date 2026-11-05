"use client";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { useState, useEffect } from "react";
import {
  budgetCategories,
  budgetTotals,
  remunerationCheck,
  cents,
  usd,
  type Budget,
} from "@/lib/budget";
import type { Locale } from "@/lib/domain";
function Amount({
  value,
  change,
  label,
  validity,
}: {
  value: number;
  change: (n: number) => void;
  label: string;
  validity: (ok: boolean) => void;
}) {
  const [raw, setRaw] = useState((value / 100).toFixed(2));
  const invalid = cents(raw) === null;
  return (
    <label>
      {label}
      <input
        inputMode="decimal"
        value={raw}
        aria-invalid={invalid}
        onChange={(e) => {
          setRaw(e.target.value);
          const n = cents(e.target.value);
          validity(n !== null);
          if (n !== null) change(n);
        }}
        onBlur={() => {
          const n = cents(raw);
          if (n !== null) setRaw((n / 100).toFixed(2));
        }}
      />
      {invalid && (
        <small role="alert">
          USD: 0.00 — use como máximo dos decimales / use at most two decimals
        </small>
      )}
    </label>
  );
}
export function BudgetFields({
  value,
  years,
  locale,
  onChange,
  onValidity,
}: {
  value?: Budget;
  years: number;
  locale: Locale;
  onChange: (v: Budget) => void;
  onValidity: (ok: boolean) => void;
}) {
  useEffect(() => {
    onValidity(true);
  }, [onValidity]);
  const es = locale === "es";
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  if (!value)
    return (
      <section className="live-card">
        <h3 className="application-section-title">
          {es ? "Presupuesto anual GLF y Otros" : "Annual GLF and Other budget"}
        </h3>
        <p>
          {es
            ? "Los importes anteriores se conservan. Organice el detalle sin distribuir automáticamente los valores históricos. Al editar el detalle, los importes generales se actualizarán con sus sumas."
            : "Existing amounts are preserved. Organize the detail without automatically allocating historical amounts. Editing the detail updates the summary totals."}
        </p>
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            onChange({
              version: "glf-annual-v1",
              currency: "USD",
              years: Math.max(1, Math.min(3, years)),
              lines: [],
            })
          }
        >
          {es ? "Preparar presupuesto detallado" : "Prepare detailed budget"}
        </button>
      </section>
    );
  const totals = budgetTotals(value),
    check = remunerationCheck(value);
  const update = (id: string, patch: Partial<Budget["lines"][number]>) =>
    onChange({
      ...value,
      lines: value.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  const mark = (id: string, ok: boolean) => {
    const next = { ...invalid, [id]: !ok };
    setInvalid(next);
    onValidity(!Object.values(next).some(Boolean));
  };
  return (
    <section className="live-card budget-fields" data-validation-field="budget">
      <h3 className="application-section-title">
        {es
          ? "Presupuesto anual GLF y Otros (USD)"
          : "Annual GLF and Other budget (USD)"}
      </h3>
      <p>
        {es
          ? "Importes en dólares estadounidenses, incluidos impuestos. Año 1, Año 2 y Año 3 corresponden a la ejecución del proyecto."
          : "Amounts in US dollars, including taxes. Year 1, Year 2 and Year 3 refer to project implementation."}
      </p>
      <label>
        {es ? "Años de ejecución" : "Implementation years"}
        <select
          value={value.years}
          onChange={(e) => {
            const y = Number(e.target.value);
            if (value.lines.some((l) => l.year > y)) return;
            onChange({ ...value, years: y });
          }}
        >
          {Array.from({ length: Math.max(years, value.years) }, (_, i) => i + 1)
            .filter((y) => y <= 3)
            .map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
        </select>
      </label>
      {value.lines.map((l, i) => (
        <section role="group" className="activity-card" key={l.id}>
          <div className="form-card-heading">
            <h3 className="section-card-title">
              {es ? "Partida" : "Line"} {i + 1}
            </h3>
            <ConfirmRemoveButton
              locale={es ? "es" : "en"}
              element={`${es ? "Partida" : "Budget line"} ${i + 1}: ${l.description || "—"}`}
              consequence={
                es
                  ? "Se eliminará esta partida y sus importes. Los totales del presupuesto se recalcularán con las partidas restantes."
                  : "This budget line and its amounts will be removed. Budget totals will be recalculated from the remaining lines."
              }
              onConfirm={() => {
                const next = Object.fromEntries(
                  Object.entries(invalid).filter(([k]) => !k.startsWith(l.id)),
                );
                setInvalid(next);
                onValidity(!Object.values(next).some(Boolean));
                onChange({
                  ...value,
                  lines: value.lines.filter((x) => x.id !== l.id),
                });
              }}
              aria-label={`${es ? "Eliminar partida" : "Remove budget line"} ${i + 1}`}
            />
          </div>
          <div className="live-grid">
            <label>
              {es ? "Año" : "Year"}
              <select
                value={l.year}
                onChange={(e) => update(l.id, { year: Number(e.target.value) })}
              >
                {Array.from({ length: value.years }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {es ? "Categoría" : "Category"}
              <select
                value={l.category}
                onChange={(e) => update(l.id, { category: e.target.value })}
              >
                {budgetCategories.map((c) => (
                  <option value={c[0]} key={c[0]}>
                    {c[es ? 1 : 2]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {es ? "Descripción" : "Description"}
              <input
                value={l.description}
                onChange={(e) => update(l.id, { description: e.target.value })}
                maxLength={2000}
              />
            </label>
            <Amount
              value={l.glf}
              change={(n) => update(l.id, { glf: n })}
              label="GLF (USD)"
              validity={(ok) => mark(l.id + "glf", ok)}
            />
            <Amount
              value={l.other}
              change={(n) => update(l.id, { other: n })}
              label={es ? "Otros (USD)" : "Other (USD)"}
              validity={(ok) => mark(l.id + "other", ok)}
            />
            <label>
              {es
                ? "¿Incluye remuneraciones, honorarios o salarios?"
                : "Does this line include remuneration, fees or salaries?"}
              <select
                value={l.remuneration}
                onChange={(e) =>
                  update(l.id, {
                    remuneration: e.target.value as "yes" | "no" | "pending",
                  })
                }
              >
                <option value="pending">
                  {es ? "Pendiente de clasificación" : "Classification pending"}
                </option>
                <option value="yes">
                  {es ? "Sí, toda esta partida" : "Yes, the entire line"}
                </option>
                <option value="no">{es ? "No" : "No"}</option>
              </select>
            </label>
          </div>
          <small>
            {es
              ? "Si la partida mezcla conceptos, sepárela para identificar correctamente la remuneración."
              : "Split mixed lines to identify remuneration correctly."}
          </small>
        </section>
      ))}
      <button
        type="button"
        className="button secondary"
        disabled={value.lines.length >= 300}
        onClick={() =>
          onChange({
            ...value,
            lines: [
              ...value.lines,
              {
                id: crypto.randomUUID(),
                year: 1,
                category: "personnel",
                description: "",
                glf: 0,
                other: 0,
                remuneration: "pending",
              },
            ],
          })
        }
      >
        {es ? "+ Añadir partida" : "+ Add line"}
      </button>
      {!value.lines.length && (
        <p>
          {es
            ? "Añada partidas para iniciar el desglose. Mientras esté vacío, los importes generales se conservan sin repartir."
            : "Add lines to start the breakdown. While empty, summary amounts are preserved without allocation."}
        </p>
      )}
      {value.years > years && (
        <p role="alert" className="auth-error">
          {es
            ? "Revise los años del presupuesto: exceden la duración propuesta del proyecto."
            : "Review budget years: they exceed the proposed project duration."}
        </p>
      )}
      {value.lines.length > 0 && (
        <>
          <div className="table-scroll">
            <table>
              <caption>
                {es
                  ? "Resumen por categoría y fuente (USD)"
                  : "Summary by category and funding source (USD)"}
              </caption>
              <thead>
                <tr>
                  <th>{es ? "Categoría" : "Category"}</th>
                  {totals.years.map((y) => (
                    <th colSpan={2} key={y.year}>
                      {es ? "Año" : "Year"} {y.year}
                    </th>
                  ))}
                  <th>Total</th>
                </tr>
                <tr>
                  <th></th>
                  {totals.years.map((y) => (
                    <FragmentCells key={y.year} es={es} />
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {budgetCategories.map((c) => (
                  <tr key={c[0]}>
                    <th scope="row">{c[es ? 1 : 2]}</th>
                    {totals.years.map((y) => {
                      const lines = value.lines.filter(
                        (l) => l.category === c[0] && l.year === y.year,
                      );
                      return (
                        <BudgetCells
                          key={y.year}
                          glf={lines.reduce((s, l) => s + l.glf, 0)}
                          other={lines.reduce((s, l) => s + l.other, 0)}
                        />
                      );
                    })}
                    <td>
                      {usd(
                        totals.categories.find((t) => t.id === c[0])!.glf +
                          totals.categories.find((t) => t.id === c[0])!.other,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Subtotal</th>
                  {totals.years.map((y) => (
                    <BudgetCells key={y.year} {...y} />
                  ))}
                  <td>{usd(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p>
            <strong>
              GLF {usd(totals.glf)} · {es ? "Otros" : "Other"}{" "}
              {usd(totals.other)} · Total {usd(totals.total)}
            </strong>
          </p>
          <p role="status">
            {es
              ? "Remuneraciones identificadas (GLF + Otros)"
              : "Identified remuneration (GLF + Other)"}
            : {usd(check.amount)} /{" "}
            {es ? "30% del aporte GLF" : "30% of GLF funding"}:{" "}
            {usd(Math.floor((check.base * 3) / 10))}.{" "}
            {check.unclassified
              ? es
                ? `${check.unclassified} partidas pendientes de clasificación.`
                : `${check.unclassified} lines pending classification.`
              : ""}{" "}
            {check.exceeds
              ? es
                ? "El monto identificado supera el 30%. Revise las partidas y su clasificación."
                : "The identified amount exceeds 30%. Review the lines and their classification."
              : ""}
          </p>
        </>
      )}
    </section>
  );
}
function BudgetCells({ glf, other }: { glf: number; other: number }) {
  return (
    <>
      <td>{usd(glf)}</td>
      <td>{usd(other)}</td>
    </>
  );
}
function FragmentCells({ es }: { es: boolean }) {
  return (
    <>
      <th>GLF</th>
      <th>{es ? "Otros" : "Other"}</th>
    </>
  );
}
