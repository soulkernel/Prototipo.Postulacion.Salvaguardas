"use client";
import { useId } from "react";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { RequiredMark } from "./required-mark";
import type { Concept, Locale } from "@/lib/domain";
import { partnerRecords, type PartnerOrganization } from "@/lib/partners";
import { partnerLetterKind } from "@/lib/attachment-requirements";
export function PartnerFields({
  concept,
  locale,
  invalid,
  onChange,
  documents,
  onRemove,
}: {
  concept: Concept;
  locale: Locale;
  invalid: boolean;
  onChange: (rows: PartnerOrganization[]) => void;
  documents: { kind: string; file_name: string; protected?: boolean }[];
  onRemove: (id: string) => Promise<void>;
}) {
  const noticeId = useId(),
    es = locale === "es",
    rows = partnerRecords(concept);
  const update = (index: number, patch: Partial<PartnerOrganization>) =>
    onChange(
      rows.map((p, i) => ({
        ...p,
        id: p.id || crypto.randomUUID(),
        ...(index === i ? patch : {}),
      })),
    );
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
      {rows.map(({ id, name, support }, i) => {
        const prefix = `${noticeId}-partner-${i}`;
        const letters = documents.filter(
          (d) => d.kind === partnerLetterKind(id),
        );
        const removedFiles = letters
          .filter((d) => !d.protected)
          .map((d) => d.file_name);
        return (
          <section
            className="partner-support-card"
            key={id || `legacy-${i}`}
            data-partner-id={id}
          >
            <div className="partner-support-grid">
              <label className="partner-name-label" htmlFor={`${prefix}-name`}>
                {es
                  ? "Nombre de la organización asociada"
                  : "Partner organization name"}
                <RequiredMark locale={locale} />
              </label>
              <label
                className="partner-support-label"
                htmlFor={`${prefix}-support`}
              >
                {es
                  ? "Descripción del apoyo en la implementación del proyecto"
                  : "Description of support in project implementation"}
                <RequiredMark locale={locale} />
              </label>
              <ConfirmRemoveButton
                locale={locale}
                className="partner-support-remove"
                element={`${es ? "Organización asociada" : "Partner organization"} ${i + 1}: ${name || "—"}`}
                consequence={
                  es
                    ? `Se eliminarán la información ingresada y la carta de apoyo vinculada a esta organización, si ya fue cargada en Anexos.${removedFiles.length ? ` Archivos: ${removedFiles.join("; ")}.` : ""}${letters.some((d) => d.protected) ? " Los documentos de versiones ya enviadas se conservarán." : ""}`
                    : `The entered information and this organization's linked letter of support will be deleted, if already uploaded under Attachments.${removedFiles.length ? ` Files: ${removedFiles.join("; ")}.` : ""}${letters.some((d) => d.protected) ? " Documents belonging to previously submitted versions will be preserved." : ""}`
                }
                aria-label={`${es ? "Quitar organización asociada" : "Remove partner organization"} ${i + 1}`}
                onConfirm={() => onRemove(id)}
              />
              <input
                className="partner-name-input"
                id={`${prefix}-name`}
                value={name}
                maxLength={200}
                aria-required="true"
                aria-invalid={invalid && !name.trim()}
                aria-describedby={`${prefix}-notice${invalid && (!name.trim() || !support?.trim()) ? ` ${prefix}-error` : ""}`}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <textarea
                className="partner-support-input"
                id={`${prefix}-support`}
                value={support || ""}
                rows={3}
                maxLength={12000}
                spellCheck
                lang={locale}
                aria-required="true"
                aria-invalid={invalid && !support?.trim()}
                aria-describedby={`${prefix}-notice${invalid && (!name.trim() || !support?.trim()) ? ` ${prefix}-error` : ""}`}
                placeholder={
                  es
                    ? "Describa qué aportará y en qué actividades participará."
                    : "Describe its contribution and the activities it will support."
                }
                onChange={(e) => update(i, { support: e.target.value })}
              />
            </div>
            <small id={`${prefix}-notice`} className="field-help">
              {es
                ? "Recuerde que debe contar con una carta de apoyo de esta organización y adjuntarla en Revisar y enviar → Anexos."
                : "You must obtain a letter of support from this organization and upload it under Review and submit → Attachments."}
            </small>
            {invalid && (!name.trim() || !support?.trim()) && (
              <small
                id={`${prefix}-error`}
                className="field-warning"
                role="alert"
              >
                {es
                  ? `Complete el nombre y describa el apoyo de la organización asociada ${i + 1}, o elimine esta fila.`
                  : `Complete the name and describe the support from partner organization ${i + 1}, or remove this row.`}
              </small>
            )}
          </section>
        );
      })}
      <button
        type="button"
        className="button secondary"
        disabled={rows.length >= 50}
        onClick={() =>
          onChange([
            ...rows,
            { id: crypto.randomUUID(), name: "", support: "" },
          ])
        }
      >
        + {es ? "Agregar organización" : "Add organization"}
      </button>
    </section>
  );
}
