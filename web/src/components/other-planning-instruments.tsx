"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import {
  newOtherInstrument,
  otherInstrumentLimit,
  type OtherInstrument,
} from "../lib/strategic-alignment";

export function OtherPlanningInstruments({
  objectiveId,
  items,
  locale,
  onChange,
}: {
  objectiveId: string;
  items: OtherInstrument[];
  locale: "es" | "en";
  onChange: (items: OtherInstrument[]) => void;
}) {
  const es = locale === "es";
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  return (
    <section
      className="other-planning-instruments"
      aria-labelledby={`other-instruments-${objectiveId}`}
    >
      <h4 id={`other-instruments-${objectiveId}`}>
        {es
          ? "Otros instrumentos de planificación — opcional"
          : "Other planning instruments — optional"}
      </h4>
      <p className="field-help">
        {es
          ? "Si su objetivo general también contribuye a otro instrumento de planificación, agréguelo aquí."
          : "If your general objective also contributes to another planning instrument, add it here."}
      </p>
      {items.map((item, index) => (
        <section
          className="other-instrument-card"
          key={item.id}
          aria-labelledby={`instrument-title-${item.id}`}
        >
          <div className="other-instrument-heading">
            <h5 id={`instrument-title-${item.id}`}>
              {es ? `Instrumento ${index + 1}` : `Instrument ${index + 1}`}
            </h5>
            <ConfirmRemoveButton
              locale={locale}
              element={`${es ? "Instrumento" : "Instrument"} ${index + 1}: ${item.name || "—"}`}
              consequence={
                es
                  ? "Se eliminará únicamente esta alineación adicional. Se conservarán el objetivo general y sus demás alineaciones."
                  : "Only this additional alignment will be deleted. The general objective and its other alignments will be kept."
              }
              aria-label={
                es
                  ? `Eliminar instrumento ${index + 1}`
                  : `Delete instrument ${index + 1}`
              }
              onConfirm={() =>
                onChange(items.filter((entry) => entry.id !== item.id))
              }
              compact
            />
          </div>
          {(["name", "objective"] as const).map((field) => {
            const id = `other-instrument-${field}-${item.id}`;
            const invalid = touched[id] && !item[field].trim();
            return (
              <div key={field} className="other-instrument-field">
                <label htmlFor={id}>
                  {field === "name"
                    ? es
                      ? "Nombre del instrumento de planificación *"
                      : "Planning instrument name *"
                    : es
                      ? "Objetivo del instrumento con el que se alinea *"
                      : "Instrument objective to align with *"}
                </label>
                <textarea
                  id={id}
                  placeholder={
                    field === "name"
                      ? es
                        ? "Escriba el nombre del instrumento de planificación."
                        : "Enter the planning instrument name."
                      : es
                        ? "Escriba el objetivo de ese instrumento con el que se alinea su proyecto."
                        : "Enter the instrument objective your project aligns with."
                  }
                  rows={field === "name" ? 2 : 3}
                  maxLength={2000}
                  aria-required="true"
                  aria-invalid={Boolean(invalid)}
                  aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ""}`}
                  value={item[field]}
                  spellCheck
                  lang={locale}
                  onBlur={() =>
                    setTouched((current) => ({ ...current, [id]: true }))
                  }
                  onChange={(event) =>
                    onChange(
                      items.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, [field]: event.target.value }
                          : entry,
                      ),
                    )
                  }
                />
                <small id={`${id}-help`}>
                  {field === "name"
                    ? es
                      ? "Escriba el nombre del plan o instrumento de planificación."
                      : "Enter the name of the plan or planning instrument."
                    : es
                      ? "Indique el objetivo de ese instrumento y su código, si corresponde. No es un objetivo específico de su proyecto."
                      : "Enter that instrument's objective and its code, if applicable. This is not a specific objective of your project."}
                </small>
                {invalid && (
                  <small
                    className="field-warning"
                    role="alert"
                    data-field-message="error"
                    id={`${id}-error`}
                  >
                    {es
                      ? "Complete este campo antes de enviar. Puede guardar un borrador incompleto."
                      : "Complete this field before submitting. You may save an incomplete draft."}
                  </small>
                )}
              </div>
            );
          })}
        </section>
      ))}
      <button
        type="button"
        className="button secondary"
        disabled={items.length >= otherInstrumentLimit}
        onClick={() => onChange([...items, newOtherInstrument()])}
      >
        <Plus size={16} aria-hidden="true" />
        {es ? "Añadir otro instrumento" : "Add another instrument"}
      </button>
      {items.length >= otherInstrumentLimit && (
        <small>
          {es
            ? `Puede registrar hasta ${otherInstrumentLimit} instrumentos adicionales.`
            : `You may add up to ${otherInstrumentLimit} additional instruments.`}
        </small>
      )}
    </section>
  );
}
