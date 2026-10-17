"use client";
import { useId } from "react";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import type { Concept, Locale } from "@/lib/domain";
import { partnerRecords, type PartnerOrganization } from "@/lib/partners";
export function PartnerFields({
  concept,
  locale,
  invalid,
  onChange,
}: {
  concept: Concept;
  locale: Locale;
  invalid: boolean;
  onChange: (rows: PartnerOrganization[]) => void;
}) {
  const noticeId = useId();
  const es = locale === "es",
    rows = partnerRecords(concept);
  return (
    <section
      data-validation-field="partners"
      className="full-width partner-fields"
      aria-labelledby="partner-heading"
    >
      <h3 id="partner-heading">
        {es
          ? "Organizaciones asociadas (si aplica)"
          : "Partner organizations (if applicable)"}{" "}
        <small>({es ? "Opcional" : "Optional"})</small>
      </h3>
      {rows.map(({ id, name }, i) => (
        <div className="partner-row" key={id || `legacy-${i}`}>
          <label>
            {es ? "Organización asociada" : "Partner organization"} {i + 1}
            <input
              value={name}
              maxLength={200}
              aria-required="true"
              aria-invalid={invalid && !name.trim()}
              aria-describedby={`${noticeId}-partner-${i}`}
              onChange={(e) =>
                onChange(
                  rows.map((p, index) => ({
                    ...p,
                    id: p.id || crypto.randomUUID(),
                    name: index === i ? e.target.value : p.name,
                  })),
                )
              }
            />
            <small id={`${noticeId}-partner-${i}`} className="field-help">
              {es
                ? "Recuerde que debe contar con una carta de apoyo de esta organización y adjuntarla en Revisar y enviar → Anexos."
                : "You must obtain a letter of support from this organization and upload it under Review and submit → Attachments."}
            </small>
            {invalid && !name.trim() && (
              <small className="danger-text">
                {es
                  ? "Complete el nombre o quite esta fila."
                  : "Enter the name or remove this row."}
              </small>
            )}
          </label>
          <ConfirmRemoveButton
            locale={locale}
            element={`${es ? "Organización asociada" : "Partner organization"} ${i + 1}: ${name || "—"}`}
            consequence={
              es
                ? "Se eliminará esta organización del formulario y dejará de exigirse su carta de apoyo. Los archivos ya cargados se conservarán en el historial documental y no se asignarán a otra organización."
                : "This organization will be removed from the form and its letter of support will no longer be required. Uploaded files will remain in the document history and will not be assigned to another organization."
            }
            aria-label={
              (es
                ? "Quitar organización asociada "
                : "Remove partner organization ") +
              (i + 1)
            }
            onConfirm={() => onChange(rows.filter((_, index) => index !== i))}
          />
        </div>
      ))}
      <button
        type="button"
        className="button secondary"
        disabled={rows.length >= 50}
        onClick={() =>
          onChange([...rows, { id: crypto.randomUUID(), name: "" }])
        }
      >
        + {es ? "Agregar organización" : "Add organization"}
      </button>
    </section>
  );
}
