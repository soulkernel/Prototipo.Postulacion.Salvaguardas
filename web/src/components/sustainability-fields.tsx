"use client";
import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Payload, Locale } from "@/lib/domain";
import {
  newSustainabilityItem,
  sustainabilityEntryIssues,
  sustainabilityReference,
  sustainabilityActor,
  sustainabilityIndicator,
  replicationOptions,
  replicationLabel,
  type SustainabilityItem,
  type SustainabilityReference,
  type SustainabilityField,
} from "@/lib/sustainability-plan";
import { monitoringEntryIssues } from "@/lib/monitoring-plan";
import { narrativeTextForEditing } from "@/lib/concept-presentation";
import { NarrativeTextarea } from "./narrative-textarea";
import { LimitedTextarea } from "./limited-textarea";
import { RequiredMark } from "./required-mark";
import { ConfirmRemoveButton } from "./confirm-remove-button";

export function SustainabilityFields({
  payload,
  locale,
  checked,
  onChange,
}: {
  payload: Payload;
  locale: Locale;
  checked: boolean;
  onChange: (concept: Payload["concept"]) => void;
}) {
  const id = useId(),
    es = locale === "es",
    c = payload.concept,
    value = c.sustainability_plan;
  const [empty, setEmpty] = useState(newSustainabilityItem);
  const [legacyMode, setLegacyMode] = useState(
    value === undefined && !!c.sustainability.trim(),
  );
  const [folded, setFolded] = useState<Set<string>>(() => new Set());
  const rows = value?.length ? value : [empty];
  const change = (plan: SustainabilityItem[]) =>
    onChange({ ...c, sustainability_plan: plan });
  const update = (index: number, patch: Partial<SustainabilityItem>) =>
    change(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const short = (text: string) =>
    text.length > 180 ? text.slice(0, 180) + "…" : text;
  const choices: SustainabilityReference[] = [
    ...(c.project_results || [])
      .filter((r) => r.result.trim())
      .map((r) => ({ type: "result" as const, id: r.id })),
    ...payload.activities
      .filter((a) => a.title.trim())
      .map((a) => ({ type: "activity" as const, id: a.id })),
  ];
  const partners = (c.partner_organizations || []).filter((p) => p.name.trim());
  return (
    <section
      id="sustainability-plan"
      className="sustainability-fields full-width"
      data-validation-field="sustainability"
    >
      <div className="sustainability-section-heading">
        <h2>
          {es
            ? "Sostenibilidad y replicabilidad"
            : "Sustainability and replication"}
        </h2>
        {value?.length ? (
          <span>
            {value.length}{" "}
            {es
              ? value.length === 1
                ? "estrategia"
                : "estrategias"
              : value.length === 1
                ? "strategy"
                : "strategies"}
          </span>
        ) : null}
      </div>
      <p className="field-help">
        {es
          ? "Explique qué trabajo o beneficios continuarán después del financiamiento, cómo se sostendrán y quién podría darles continuidad. Indique también las posibilidades y condiciones de ampliación o réplica."
          : "Explain what work or benefits will continue after funding, how they will be sustained and who could ensure continuity. Also state the potential and conditions for scaling up or replication."}
      </p>
      {value === undefined && legacyMode ? (
        <>
          <label htmlFor={`${id}-legacy`}>
            {es
              ? "Propuesta de sostenibilidad y replicabilidad"
              : "Proposed sustainability and replication"}
            <RequiredMark locale={locale} />
          </label>
          <NarrativeTextarea
            id={`${id}-legacy`}
            locale={locale}
            label={
              es
                ? "Propuesta de sostenibilidad y replicabilidad"
                : "Proposed sustainability and replication"
            }
            value={narrativeTextForEditing(c.sustainability)}
            placeholder={
              es
                ? "Explique cómo se mantendrán los beneficios y cómo podría replicarse el proyecto."
                : "Explain how benefits will be sustained and how the project could be replicated."
            }
            onChange={(sustainability) => onChange({ ...c, sustainability })}
          />
          <p className="field-help">
            {es
              ? "Puede seguir editando el texto guardado. Organizarlo en fichas es opcional; el texto original se conserva y usted establece las asociaciones."
              : "You can keep editing the saved text. Organizing it into cards is optional; the original text is retained and you select the links."}
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setLegacyMode(false);
              change([empty]);
            }}
          >
            {es
              ? "Organizar en estrategias vinculadas (opcional)"
              : "Organize into linked strategies (optional)"}
          </button>
        </>
      ) : (
        <>
          {rows.map((item, i) => {
            const issues = sustainabilityEntryIssues(payload, item),
              collapsed = folded.has(item.id) && !issues.length;
            const invalid = (key: SustainabilityField) =>
              checked && issues.includes(key);
            const actorValue =
              item.actor_type === "partner"
                ? `partner:${item.actor_id}`
                : item.actor_type;
            const objectives = [
              ...new Set(
                item.references.flatMap(
                  (ref) =>
                    sustainabilityReference(payload, ref, locale).objectives,
                ),
              ),
            ];
            const missingActor =
              item.actor_type === "partner" &&
              !partners.some((p) => p.id === item.actor_id);
            const missingIndicator =
              !!item.monitoring_id &&
              !(c.monitoring_plan || []).some(
                (m) => m.id === item.monitoring_id,
              );
            const prefix = `${id}-card-${i}`;
            return (
              <section
                key={item.id}
                className="sustainability-card"
                role="group"
                aria-labelledby={`${prefix}-title`}
                data-validation-sustainability={i + 1}
              >
                <div className="sustainability-card-heading">
                  <h3 id={`${prefix}-title`}>
                    {es
                      ? "Estrategia de sostenibilidad"
                      : "Sustainability strategy"}{" "}
                    {i + 1}
                  </h3>
                  <div className="sustainability-card-actions">
                    {!issues.length && (
                      <button
                        type="button"
                        className="button secondary sustainability-fold"
                        aria-expanded={!collapsed}
                        aria-controls={`${prefix}-body`}
                        onClick={() =>
                          setFolded((previous) => {
                            const next = new Set(previous);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          })
                        }
                      >
                        {collapsed ? (
                          <ChevronDown size={16} aria-hidden="true" />
                        ) : (
                          <ChevronUp size={16} aria-hidden="true" />
                        )}
                        {collapsed
                          ? es
                            ? "Editar"
                            : "Edit"
                          : es
                            ? "Plegar"
                            : "Collapse"}
                      </button>
                    )}
                    {!!value?.length && (
                      <ConfirmRemoveButton
                        locale={locale}
                        aria-label={`${es ? "Eliminar estrategia" : "Delete strategy"} ${i + 1}`}
                        element={`${es ? "Estrategia de sostenibilidad" : "Sustainability strategy"} ${i + 1}`}
                        consequence={
                          es
                            ? "Se eliminarán esta estrategia y sus asociaciones. Los resultados, las actividades, las organizaciones y los indicadores relacionados se conservarán."
                            : "This strategy and its associations will be removed. Related outcomes, activities, organizations and indicators will be kept."
                        }
                        onConfirm={() => {
                          const rest = value.filter((r) => r.id !== item.id);
                          if (!rest.length) setEmpty(newSustainabilityItem());
                          change(rest);
                        }}
                      />
                    )}
                  </div>
                </div>
                {collapsed && (
                  <p className="sustainability-card-summary">
                    {item.references.length}{" "}
                    {es ? "registros asociados" : "linked records"} ·{" "}
                    {sustainabilityActor(payload, item, locale)} ·{" "}
                    {replicationLabel(item.replication, locale)}
                  </p>
                )}
                <div
                  id={`${prefix}-body`}
                  className="sustainability-grid"
                  hidden={collapsed}
                >
                  <div className="sustainability-wide sustainability-reference-field">
                    <label htmlFor={`${prefix}-references`}>
                      {es
                        ? "Resultados o actividades a los que aplica"
                        : "Outcomes or activities this strategy applies to"}
                      <RequiredMark locale={locale} />
                    </label>
                    <select
                      id={`${prefix}-references`}
                      value=""
                      data-validation-field="references"
                      aria-required="true"
                      aria-invalid={invalid("references")}
                      aria-describedby={`${prefix}-reference-help`}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [type, referenceId] = e.target.value.split(":");
                        update(i, {
                          references: [
                            ...item.references,
                            {
                              type: type as SustainabilityReference["type"],
                              id: referenceId,
                            },
                          ],
                        });
                      }}
                    >
                      <option value="">
                        {es
                          ? "Seleccione un registro para asociarlo"
                          : "Select a record to link"}
                      </option>
                      {(["result", "activity"] as const).map((type) => (
                        <optgroup
                          key={type}
                          label={
                            type === "result"
                              ? es
                                ? "Resultados"
                                : "Outcomes"
                              : es
                                ? "Actividades"
                                : "Activities"
                          }
                        >
                          {choices
                            .filter(
                              (r) =>
                                r.type === type &&
                                !item.references.some(
                                  (v) => v.type === r.type && v.id === r.id,
                                ),
                            )
                            .map((ref) => {
                              const link = sustainabilityReference(
                                payload,
                                ref,
                                locale,
                              );
                              return (
                                <option
                                  key={ref.id}
                                  value={`${ref.type}:${ref.id}`}
                                  disabled={!link.valid}
                                >
                                  {short(link.label)}
                                  {!link.valid
                                    ? es
                                      ? " — Revise sus objetivos"
                                      : " — Check its objectives"
                                    : ""}
                                </option>
                              );
                            })}
                        </optgroup>
                      ))}
                    </select>
                    <small
                      id={`${prefix}-reference-help`}
                      className="field-help"
                    >
                      {es
                        ? "Puede asociar varios registros a una misma estrategia. Los objetivos se muestran desde esos registros."
                        : "You can link several records to one strategy. Objectives are shown from those records."}
                    </small>
                    {!!item.references.length && (
                      <ul className="sustainability-selected-records">
                        {item.references.map((ref) => {
                          const link = sustainabilityReference(
                            payload,
                            ref,
                            locale,
                          );
                          return (
                            <li key={`${ref.type}:${ref.id}`}>
                              <label className="check-row" title={link.label}>
                                <input
                                  type="checkbox"
                                  checked
                                  onChange={() =>
                                    update(i, {
                                      references: item.references.filter(
                                        (r) =>
                                          r.type !== ref.type ||
                                          r.id !== ref.id,
                                      ),
                                    })
                                  }
                                />
                                <span>
                                  {link.missing
                                    ? es
                                      ? "Registro eliminado: desmarque y seleccione otro"
                                      : "Record removed: uncheck and select another"
                                    : short(link.label)}
                                  {!link.valid && (
                                    <strong className="sustainability-pending">
                                      {es
                                        ? " · Asociación pendiente de revisar"
                                        : " · Link awaiting review"}
                                    </strong>
                                  )}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {!!objectives.length && (
                      <details className="sustainability-objectives">
                        <summary>
                          {es
                            ? "Ver objetivos específicos asociados"
                            : "View associated specific objectives"}{" "}
                          ({objectives.length})
                        </summary>
                        <ul>
                          {objectives.map((text, n) => (
                            <li key={n}>{text}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  <label className="sustainability-wide">
                    <span>
                      {es
                        ? "Estrategia de sostenibilidad y apropiación"
                        : "Sustainability and ownership strategy"}
                      <RequiredMark locale={locale} />
                    </span>
                    <LimitedTextarea
                      rows={3}
                      locale={locale}
                      value={item.strategy}
                      data-validation-field="strategy"
                      aria-required="true"
                      aria-invalid={invalid("strategy")}
                      placeholder={
                        es
                          ? "Explique cómo continuará el trabajo o sus beneficios y cómo se asumirá esa continuidad."
                          : "Explain how the work or its benefits will continue and how that continuity will be taken on."
                      }
                      onChange={(e) => update(i, { strategy: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>
                      {es
                        ? "Actor previsto para dar continuidad"
                        : "Actor expected to ensure continuity"}
                      <RequiredMark locale={locale} />
                    </span>
                    <select
                      data-validation-field="actor_type"
                      value={actorValue}
                      aria-required="true"
                      aria-invalid={
                        invalid("actor_type") ||
                        invalid("actor_id") ||
                        missingActor
                      }
                      onChange={(e) => {
                        const selected = e.target.value;
                        update(i, {
                          actor_type: (selected.startsWith("partner:")
                            ? "partner"
                            : selected) as SustainabilityItem["actor_type"],
                          actor_id: selected.startsWith("partner:")
                            ? selected.slice(8)
                            : "",
                          actor_name:
                            selected === "other" ? item.actor_name : "",
                        });
                      }}
                    >
                      <option value="">
                        {es
                          ? "Seleccione el actor previsto"
                          : "Select the expected actor"}
                      </option>
                      <option value="applicant">
                        {es ? "Proponente" : "Applicant"}
                        {c.applicant_name ? `: ${short(c.applicant_name)}` : ""}
                      </option>
                      {missingActor && (
                        <option value={actorValue}>
                          {es
                            ? "Organización eliminada: seleccione otro actor"
                            : "Organization removed: select another actor"}
                        </option>
                      )}
                      {partners.map((p) => (
                        <option key={p.id} value={`partner:${p.id}`}>
                          {p.name}
                        </option>
                      ))}
                      <option value="other">
                        {es ? "Otro actor" : "Other actor"}
                      </option>
                      <option value="undecided">
                        {es
                          ? "Por definir en el proyecto completo"
                          : "To be defined in the full proposal"}
                      </option>
                    </select>
                  </label>
                  <label>
                    <span>
                      {es
                        ? "Posibilidad de ampliación o réplica"
                        : "Potential for scaling up or replication"}
                      <RequiredMark locale={locale} />
                    </span>
                    <select
                      data-validation-field="replication"
                      value={item.replication}
                      aria-required="true"
                      aria-invalid={invalid("replication")}
                      onChange={(e) =>
                        update(i, {
                          replication: e.target
                            .value as SustainabilityItem["replication"],
                        })
                      }
                    >
                      <option value="">
                        {es ? "Seleccione una opción" : "Select an option"}
                      </option>
                      {replicationOptions.map((o) => (
                        <option key={o[0]} value={o[0]}>
                          {o[es ? 1 : 2]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {item.actor_type === "other" && (
                    <label className="sustainability-wide">
                      <span>
                        {es ? "Nombre del otro actor" : "Other actor name"}
                        <RequiredMark locale={locale} />
                      </span>
                      <input
                        data-validation-field="actor_name"
                        maxLength={200}
                        value={item.actor_name}
                        aria-required="true"
                        aria-invalid={invalid("actor_name")}
                        placeholder={
                          es
                            ? "Indique quién podría dar continuidad al trabajo."
                            : "State who could ensure continuity of the work."
                        }
                        onChange={(e) =>
                          update(i, { actor_name: e.target.value })
                        }
                      />
                    </label>
                  )}
                  <label className="sustainability-wide">
                    <span>
                      {item.replication === "none" ||
                      item.replication === "undecided"
                        ? es
                          ? "Explique brevemente el motivo de su respuesta"
                          : "Briefly explain the reason for your response"
                        : es
                          ? "Condiciones para la ampliación o réplica"
                          : "Conditions for scaling up or replication"}
                      <RequiredMark locale={locale} />
                    </span>
                    <LimitedTextarea
                      rows={3}
                      locale={locale}
                      data-validation-field="replication_details"
                      value={item.replication_details}
                      aria-required="true"
                      aria-invalid={invalid("replication_details")}
                      placeholder={
                        item.replication === "none" ||
                        item.replication === "undecided"
                          ? es
                            ? "Explique por qué no se prevé o qué falta definir."
                            : "Explain why it is not planned or what remains to be defined."
                          : es
                            ? "Indique dónde o cómo podría ampliarse o replicarse y qué condiciones necesitaría."
                            : "State where or how it could be scaled up or replicated and the conditions needed."
                      }
                      onChange={(e) =>
                        update(i, { replication_details: e.target.value })
                      }
                    />
                  </label>
                  <details
                    className="sustainability-wide sustainability-indicator"
                    open={!!item.monitoring_id || invalid("monitoring_id")}
                  >
                    <summary>
                      {item.monitoring_id
                        ? es
                          ? "Indicador de seguimiento vinculado"
                          : "Linked monitoring indicator"
                        : es
                          ? "Vincular un indicador de seguimiento — opcional"
                          : "Link a monitoring indicator — optional"}
                    </summary>
                    <label>
                      <span>
                        {es
                          ? "Indicador de seguimiento relacionado"
                          : "Related monitoring indicator"}
                      </span>
                      <select
                        data-validation-field="monitoring_id"
                        value={item.monitoring_id}
                        aria-invalid={invalid("monitoring_id")}
                        onChange={(e) =>
                          update(i, { monitoring_id: e.target.value })
                        }
                      >
                        <option value="">
                          {es
                            ? "Sin indicador vinculado"
                            : "No linked indicator"}
                        </option>
                        {missingIndicator && (
                          <option value={item.monitoring_id}>
                            {es
                              ? "Indicador eliminado: seleccione otro o retire el vínculo"
                              : "Indicator removed: select another or remove the link"}
                          </option>
                        )}
                        {(c.monitoring_plan || []).map((m) => (
                          <option
                            key={m.id}
                            value={m.id}
                            disabled={
                              monitoringEntryIssues(payload, m).length > 0
                            }
                          >
                            {short(
                              sustainabilityIndicator(
                                payload,
                                { ...item, monitoring_id: m.id },
                                locale,
                              ),
                            )}
                          </option>
                        ))}
                      </select>
                    </label>
                    <small className="field-help">
                      {es
                        ? "Reutilice un indicador de Seguimiento y evaluación, si corresponde. Esta selección establece una relación explícita; no se deduce por compartir un objetivo."
                        : "Reuse an indicator from Monitoring and evaluation, if applicable. This selection establishes an explicit link; sharing an objective does not imply a link."}
                    </small>
                  </details>
                  {issues.some((key) =>
                    ["actor_id", "monitoring_id"].includes(key),
                  ) && (
                    <p
                      className="sustainability-wide sustainability-pending"
                      role="alert"
                    >
                      {es
                        ? "La estrategia conserva su información. Revise la organización o el indicador vinculado antes de continuar."
                        : "The strategy retains its information. Review the linked organization or indicator before continuing."}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
          <button
            type="button"
            className="button secondary"
            disabled={(value?.length || 0) >= 30}
            onClick={() => change([...rows, newSustainabilityItem()])}
          >
            {es ? "+ Agregar otra estrategia" : "+ Add another strategy"}
          </button>
        </>
      )}
    </section>
  );
}
