"use client";
import { narrativeBlocks, type ContentBlock } from "@/lib/concept-presentation";
import { LimitedTextarea } from "./limited-textarea";
import { RequiredMark } from "./required-mark";
import { RemoveButton } from "./remove-button";

export function serializeNarrative(blocks: ContentBlock[]): string {
  const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return blocks
    .map((b) =>
      b.type === "paragraph"
        ? b.text
        : [b.headers, b.headers.map(() => "---"), ...b.rows]
            .map((row) => "| " + row.map(cell).join(" | ") + " |")
            .join("\n"),
    )
    .join("\n\n");
}

export function NarrativeEditor({
  value,
  onChange,
  label,
  fieldKey,
  locale,
  invalid = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  fieldKey: string;
  locale: "es" | "en";
  invalid?: boolean;
}) {
  const blocks = narrativeBlocks(value),
    es = locale === "es";
  if (!blocks.some((b) => b.type === "table"))
    return (
      <label
        className="editor-field full-width"
        data-validation-field={fieldKey}
      >
        <span className="field-label">
          {label}
          <RequiredMark locale={locale} />
        </span>
        <LimitedTextarea
          locale={locale}
          aria-required="true"
          aria-invalid={invalid}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  function change(index: number, next: ContentBlock) {
    const updated = serializeNarrative(
      blocks.map((b, i) => (i === index ? next : b)),
    );
    if (updated.length <= 12000) onChange(updated);
  }
  return (
    <section
      className="full-width narrative-table-editor"
      data-validation-field={fieldKey}
      aria-label={label}
    >
      <h3>
        <span className="field-label">
          {label}
          <RequiredMark locale={locale} />
        </span>
      </h3>
      {blocks.map((b, index) =>
        b.type === "paragraph" ? (
          <label key={index}>
            <span className="field-label">
              {es ? "Descripción" : "Description"}
            </span>
            <LimitedTextarea
              locale={locale}
              value={b.text}
              onChange={(e) => change(index, { ...b, text: e.target.value })}
              maxLength={12000 - value.length + b.text.length}
            />
          </label>
        ) : (
          <div key={index}>
            <div
              className="concept-table-scroll"
              role="region"
              aria-label={label}
              tabIndex={0}
            >
              <table className="concept-review-table narrative-edit-table">
                <thead>
                  <tr>
                    {b.headers.map((h, j) => (
                      <th scope="col" key={j}>
                        {h}
                      </th>
                    ))}
                    <th scope="col">
                      <span className="sr-only">
                        {es ? "Acciones" : "Actions"}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((v, j) => (
                        <td key={j}>
                          <LimitedTextarea
                            locale={locale}
                            aria-required="true"
                            aria-invalid={invalid && !v.trim()}
                            aria-label={`${label}: ${b.headers[j]} · ${es ? "fila" : "row"} ${i + 1}`}
                            value={v}
                            maxLength={12000 - value.length + v.length}
                            onChange={(e) =>
                              change(index, {
                                ...b,
                                rows: b.rows.map((r, ri) =>
                                  ri === i
                                    ? r.map((c, ci) =>
                                        ci === j ? e.target.value : c,
                                      )
                                    : r,
                                ),
                              })
                            }
                          />
                        </td>
                      ))}
                      <td>
                        <RemoveButton
                          aria-label={`${es ? "Quitar fila" : "Remove row"} ${i + 1} · ${label}`}
                          disabled={b.rows.length <= 1}
                          onClick={() =>
                            change(index, {
                              ...b,
                              rows: b.rows.filter((_, ri) => ri !== i),
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="button secondary"
              disabled={value.length > 11500 || b.rows.length >= 30}
              onClick={() =>
                change(index, {
                  ...b,
                  rows: [...b.rows, b.headers.map(() => "")],
                })
              }
            >
              + {es ? "Agregar fila" : "Add row"}
            </button>
          </div>
        ),
      )}
    </section>
  );
}
