"use client";
import type { Concept, Locale } from "@/lib/domain";
import { partnerOrganizations } from "@/lib/partners";
export function PartnerFields({
  concept,
  locale,
  invalid,
  onChange,
}: {
  concept: Concept;
  locale: Locale;
  invalid: boolean;
  onChange: (names: string[]) => void;
}) {
  const es = locale === "es",
    names = partnerOrganizations(concept);
  return (
    <section
      className="full-width partner-fields"
      aria-labelledby="partner-heading"
    >
      <h3 id="partner-heading">
        {es
          ? "Organizaciones asociadas (si aplica)"
          : "Partner organizations (if applicable)"}{" "}
        <small>({es ? "Opcional" : "Optional"})</small>
      </h3>
      {names.map((name, i) => (
        <div className="partner-row" key={i}>
          <label>
            {es ? "Organización asociada" : "Partner organization"} {i + 1}
            <input
              value={name}
              maxLength={200}
              aria-required="true"
              aria-invalid={invalid && !name.trim()}
              onChange={(e) =>
                onChange(
                  names.map((n, index) => (index === i ? e.target.value : n)),
                )
              }
            />
            {invalid && !name.trim() && (
              <small className="danger-text">
                {es
                  ? "Complete el nombre o quite esta fila."
                  : "Enter the name or remove this row."}
              </small>
            )}
          </label>
          <button
            type="button"
            className="button secondary"
            aria-label={
              (es
                ? "Quitar organización asociada "
                : "Remove partner organization ") +
              (i + 1)
            }
            onClick={() => onChange(names.filter((_, index) => index !== i))}
          >
            {es ? "Quitar" : "Remove"}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button secondary"
        disabled={names.length >= 50}
        onClick={() => onChange([...names, ""])}
      >
        + {es ? "Agregar organización" : "Add organization"}
      </button>
    </section>
  );
}
