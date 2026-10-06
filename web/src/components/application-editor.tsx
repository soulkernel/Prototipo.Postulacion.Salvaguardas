"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Save,
  Send,
  Trash2,
  ShieldCheck,
  LockKeyhole,
  FileDown,
} from "lucide-react";
import { saveDraft, submitDraft } from "@/app/applicant/actions";
import { identityFields, narrativeFields, statusLabel } from "@/lib/fields";
import {
  newActivity,
  newRisk,
  riskScore,
  riskLevel,
  validateComplete,
  words,
  type Application,
  type Call,
  type Locale,
  type Risk,
  type Payload,
  type Concept,
} from "@/lib/domain";
type Catalog = {
  id: string;
  label_es: string;
  label_en: string;
  normative_reference: string;
};
type Version = {
  id: string;
  revision: number;
  stage: number;
  submitted_at: string;
};
type DocumentRow = {
  id: string;
  file_name: string;
  kind: string;
  created_at: string;
};
const levels = {
  es: {
    incomplete: "Sin completar",
    low: "Bajo",
    medium: "Medio",
    high: "Alto",
    very_high: "Muy alto",
  },
  en: {
    incomplete: "Incomplete",
    low: "Low",
    medium: "Medium",
    high: "High",
    very_high: "Very high",
  },
};
function message(code: string, es: boolean) {
  if (code.includes("VERSION_CONFLICT"))
    return es
      ? "Hay una versión más reciente. Recargue el expediente antes de guardar; copie primero cualquier cambio que desee conservar."
      : "A newer version exists. Reload before saving; first copy any changes you want to keep.";
  if (code.includes("LOCKED"))
    return es
      ? "El expediente está bloqueado o el plazo de postulación terminó."
      : "This application is locked or its deadline has passed.";
  if (code.includes("ATTACHMENT_REQUIRED"))
    return es
      ? "Falta un anexo obligatorio de esta convocatoria."
      : "A required call attachment is missing.";
  if (code.includes("COFINANCE"))
    return es
      ? "El cofinanciamiento no alcanza lo exigido por la categoría."
      : "Cofinancing does not meet the category requirement.";
  if (code.includes("ADMIN_LIMIT"))
    return es
      ? "Los gastos administrativos superan el límite de la convocatoria."
      : "Administrative expenses exceed the call's limit.";
  if (code.includes("CATEGORY_AMOUNT") || code.includes("CATEGORY_DURATION"))
    return es
      ? "Revise el monto y las fechas según la categoría seleccionada."
      : "Check the amount and dates against the selected grant category.";
  if (code.includes("QUARTER") || code.includes("OUTSIDE_PROJECT"))
    return es
      ? "Revise los trimestres: deben estar en orden y dentro de la duración del proyecto."
      : "Check the quarters: they must be ordered and within the project duration.";
  if (
    code.includes("REQUIRED") ||
    code.includes("INVALID") ||
    code.includes("LIMIT")
  )
    return es
      ? "Revise los campos obligatorios, límites y declaraciones antes de enviar."
      : "Check required fields, limits and declarations before submitting.";
  return es
    ? "No se completó la operación. Sus cambios permanecen en pantalla; inténtelo de nuevo."
    : "The operation was not completed. Your edits remain on screen; please try again.";
}
export function ApplicationEditor({
  application,
  call,
  locale,
  editable,
  catalog,
  versions,
  documents: initialDocuments,
}: {
  application: Application;
  call: Call;
  locale: Locale;
  editable: boolean;
  catalog: Catalog[];
  versions: Version[];
  documents: DocumentRow[];
}) {
  const es = locale === "es";
  const router = useRouter();
  const [payload, setPayload] = useState<Payload>(application.payload);
  const [revision, setRevision] = useState(application.revision);
  const [saved, setSaved] = useState(JSON.stringify(application.payload));
  const [step, setStep] = useState(editable ? 0 : 3);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState(initialDocuments);
  const dirty = JSON.stringify(payload) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const updateConcept = (key: keyof Concept, value: string | number | null) =>
    setPayload((p) => ({ ...p, concept: { ...p.concept, [key]: value } }));
  const updateActivity = (
    index: number,
    patch: Partial<Payload["activities"][number]>,
  ) =>
    setPayload((p) => ({
      ...p,
      activities: p.activities.map((a, i) =>
        i === index ? { ...a, ...patch } : a,
      ),
    }));
  const updateRisk = (ai: number, ri: number, patch: Partial<Risk>) =>
    setPayload((p) => ({
      ...p,
      activities: p.activities.map((a, i) =>
        i !== ai
          ? a
          : {
              ...a,
              risks: a.risks.map((r, j) => (j === ri ? { ...r, ...patch } : r)),
            },
      ),
    }));
  const scale = (
    label: string,
    value: number | null,
    onChange: (n: number | null) => void,
  ) => (
    <label>
      {label}
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{es ? "Seleccione" : "Select"}</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
  const quarter = (
    label: string,
    value: number | null,
    onChange: (n: number | null) => void,
  ) => (
    <label>
      {label}
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{es ? "Seleccione" : "Select"}</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {es ? "Año" : "Year"} {Math.ceil(n / 4)} · T{((n - 1) % 4) + 1}
          </option>
        ))}
      </select>
    </label>
  );
  async function persist(submit = false) {
    if (busy || !editable) return;
    if (submit) {
      const missing = validateComplete(payload, application.rules_snapshot);
      if (missing.length) {
        setError(
          (es ? "Complete o revise: " : "Complete or review: ") +
            missing
              .map((key) => {
                const field = [...identityFields, ...narrativeFields].find(
                  (f) => f.key === key,
                );
                if (field) return es ? field.es : field.en;
                const labels: Record<string, [string, string]> = {
                  applicant_type: ["Tipo de solicitante", "Applicant type"],
                  category_id: ["Categoría de subvención", "Grant category"],
                  summary_word_limit: [
                    "Extensión del resumen",
                    "Summary length",
                  ],
                  activities: ["Actividades", "Activities"],
                  declarations: ["Declaraciones finales", "Final declarations"],
                };
                if (labels[key]) return labels[key][es ? 0 : 1];
                const parts = key.match(
                  /^(risk|quarters|activity|no_risks_reason)_(\d+)(?:_(\d+))?$/,
                );
                if (parts)
                  return (
                    (parts[1] === "activity"
                      ? es
                        ? "Actividad "
                        : "Activity "
                      : parts[1] === "no_risks_reason"
                        ? es
                          ? "Justificación sin riesgos de actividad "
                          : "No-risk explanation for activity "
                        : es
                          ? "Riesgo de actividad "
                          : "Risk for activity ") +
                    parts[2] +
                    (parts[3] ? "." + parts[3] : "")
                  );
                return es ? "Campos obligatorios" : "Required fields";
              })
              .join(", "),
        );
        return;
      }
    }
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      let nextRevision = revision;
      if (dirty) {
        const result = await saveDraft(application.id, revision, payload);
        if (!result.ok) {
          setError(message(result.error, es));
          return;
        }
        nextRevision = result.revision;
        setRevision(nextRevision);
        setSaved(JSON.stringify(payload));
      }
      if (submit) {
        const result = await submitDraft(application.id, nextRevision);
        if (!result.ok) {
          setError(message(result.error, es));
          return;
        }
        setRevision(result.revision);
        router.refresh();
      } else
        setFeedback(
          es
            ? "Borrador guardado en su cuenta."
            : "Draft saved to your account.",
        );
    } catch {
      setError(message("", es));
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("application_id", application.id);
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          es
            ? "No se pudo adjuntar el archivo. Use PDF, PNG, JPEG, DOCX o XLSX de hasta 4 MB, con un nombre válido."
            : "Could not attach the file. Use PDF, PNG, JPEG, DOCX or XLSX up to 4 MB with a valid filename.",
        );
        return;
      }
      setDocuments((d) => [result, ...d]);
      form.reset();
      setFeedback(es ? "Anexo guardado." : "Attachment saved.");
    } catch {
      setError(message("", es));
    } finally {
      setBusy(false);
    }
  }
  const fields = step === 0 ? identityFields : narrativeFields;
  const rules = application.rules_snapshot;
  const initialTotal = payload.activities
    .flatMap((a) => a.risks)
    .reduce((sum, r) => sum + (riskScore(r.probability, r.severity) || 0), 0);
  return (
    <>
      <Link href="/applicant" className="text-button">
        ← {es ? "Mis postulaciones" : "My applications"}
      </Link>
      <div className="live-title">
        <div>
          <p className="eyebrow">
            {application.reference_code} · {es ? "Fase" : "Phase"}{" "}
            {application.stage}
          </p>
          <h1>
            {payload.concept.title ||
              (es ? "Nueva postulación" : "New application")}
          </h1>
          <p>
            {es ? call.title_es : call.title_en} · {es ? "Reglas" : "Rules"}{" "}
            {rules.version || call.rules_version}
          </p>
        </div>
        <span className="status-pill neutral">
          {statusLabel(application.status, locale)}
        </span>
      </div>
      {!editable && (
        <div className="live-notice">
          <LockKeyhole size={20} />
          <p>
            {es
              ? "Esta versión está bloqueada. Las correcciones requieren autorización del GLF dentro del plazo permitido."
              : "This version is locked. Corrections require GLF authorization within the allowed deadline."}
          </p>
        </div>
      )}
      <nav
        className="wizard-tabs"
        aria-label={es ? "Pasos de la postulación" : "Application steps"}
      >
        {(es
          ? [
              "Datos generales",
              "Nota Conceptual",
              "Actividades y riesgos",
              "Revisar y enviar",
            ]
          : [
              "Project details",
              "Concept Note",
              "Activities and risks",
              "Review and submit",
            ]
        ).map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={step === i ? "step" : undefined}
            onClick={() => setStep(i)}
          >
            {i + 1}. {label}
          </button>
        ))}
      </nav>
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
      {feedback && (
        <p className="auth-success" role="status">
          {feedback}
        </p>
      )}
      <fieldset disabled={!editable || busy} className="live-fieldset">
        <div className="live-card">
          {step <= 1 && (
            <div className="live-form">
              <h2>
                {step === 0
                  ? es
                    ? "Información general y financiamiento"
                    : "Project details and funding"
                  : es
                    ? "Descripción del proyecto"
                    : "Project narrative"}
              </h2>
              <p>
                {es
                  ? "Guarde su borrador para retomarlo desde su cuenta. Complete todos los apartados aplicables antes de enviar."
                  : "Save your draft to resume it from your account. Complete all applicable sections before submitting."}
              </p>
              {step === 0 && (
                <div className="live-grid">
                  <label>
                    {es ? "Tipo de solicitante" : "Applicant type"}
                    <select
                      value={payload.concept.applicant_type}
                      onChange={(e) =>
                        updateConcept("applicant_type", e.target.value)
                      }
                    >
                      <option value="">{es ? "Seleccione" : "Select"}</option>
                      {rules.applicant_types.map((t) => (
                        <option key={t} value={t}>
                          {t === "individual"
                            ? es
                              ? "Persona natural"
                              : "Individual"
                            : t === "organization"
                              ? es
                                ? "Organización"
                                : "Organization"
                              : t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {es ? "Categoría de subvención" : "Grant category"}
                    <select
                      value={payload.concept.category_id}
                      onChange={(e) =>
                        updateConcept("category_id", e.target.value)
                      }
                    >
                      <option value="">{es ? "Seleccione" : "Select"}</option>
                      {rules.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {es ? c.label_es : c.label_en} · USD{" "}
                          {c.min_amount.toLocaleString(locale)}–
                          {c.max_amount?.toLocaleString(locale) || "∞"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div
                className={step === 0 ? "live-grid form-columns" : "live-form"}
              >
                {fields.map((field) => (
                  <label
                    key={field.key}
                    className={field.type === "textarea" ? "full-width" : ""}
                  >
                    {es ? field.es : field.en}
                    {field.type === "textarea" ? (
                      <textarea
                        rows={field.key === "summary" ? 6 : 4}
                        maxLength={12000}
                        value={String(payload.concept[field.key] ?? "")}
                        onChange={(e) =>
                          updateConcept(field.key, e.target.value)
                        }
                      />
                    ) : (
                      <input
                        type={field.type || "text"}
                        min={field.type === "number" ? 0 : undefined}
                        step={field.type === "number" ? "0.01" : undefined}
                        maxLength={
                          field.type === "date" || field.type === "number"
                            ? undefined
                            : 12000
                        }
                        value={payload.concept[field.key] ?? ""}
                        onChange={(e) =>
                          updateConcept(
                            field.key,
                            field.type === "number"
                              ? e.target.value === ""
                                ? null
                                : Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    )}{" "}
                    {field.key === "summary" && (
                      <small>
                        {words(payload.concept.summary)} /{" "}
                        {rules.summary_word_limit} {es ? "palabras" : "words"}
                      </small>
                    )}
                  </label>
                ))}
              </div>
              {step === 0 && (
                <p className="field-help">
                  {es ? "Costo total estimado" : "Estimated total cost"}: USD{" "}
                  {(
                    (payload.concept.requested_amount || 0) +
                    (payload.concept.cofinance_amount || 0)
                  ).toLocaleString(locale)}{" "}
                  · {es ? "Tope administrativo" : "Administrative limit"}:{" "}
                  {rules.max_admin_percent}%
                </p>
              )}
              {step === 1 && application.stage === 2 && (
                <section>
                  <h2>
                    {es
                      ? "Proyecto completo: campos oficiales de la convocatoria"
                      : "Full proposal: official call fields"}
                  </h2>
                  {call.phase2_schema.map((f) => (
                    <label key={f.id}>
                      {es ? f.label_es : f.label_en}
                      {f.required ? " *" : ""}
                      <textarea
                        value={payload.phase2[f.id] || ""}
                        onChange={(e) =>
                          setPayload((p) => ({
                            ...p,
                            phase2: { ...p.phase2, [f.id]: e.target.value },
                          }))
                        }
                        maxLength={12000}
                      />
                    </label>
                  ))}
                </section>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="live-form">
              <h2>
                {es
                  ? "Actividades, riesgos y salvaguardas"
                  : "Activities, risks and safeguards"}
              </h2>
              <p>
                {es
                  ? "Una actividad puede tener varios riesgos y cada riesgo varias medidas. Si no identifica riesgos, explique por qué para que GLF lo revise."
                  : "An activity can have several risks, and each risk several measures. If you identify no risks, explain why for GLF review."}
              </p>
              {payload.activities.map((activity, ai) => (
                <section className="activity-card" key={activity.id}>
                  <div className="live-title">
                    <h3>
                      {es ? "Actividad" : "Activity"} {ai + 1}
                    </h3>
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() =>
                        setPayload((p) => ({
                          ...p,
                          activities: p.activities.filter((_, i) => i !== ai),
                        }))
                      }
                    >
                      <Trash2 size={16} />
                      {es ? "Quitar actividad" : "Remove activity"}
                    </button>
                  </div>
                  <div className="live-form">
                    <label>
                      {es ? "Nombre de actividad" : "Activity name"}
                      <input
                        value={activity.title}
                        onChange={(e) =>
                          updateActivity(ai, { title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      {es ? "Descripción" : "Description"}
                      <textarea
                        rows={2}
                        value={activity.description}
                        onChange={(e) =>
                          updateActivity(ai, { description: e.target.value })
                        }
                      />
                    </label>
                    {activity.risks.length === 0 && (
                      <label>
                        {es
                          ? "Justificación si no identifica riesgos"
                          : "Explanation if no risks are identified"}
                        <textarea
                          value={activity.no_risks_reason}
                          onChange={(e) =>
                            updateActivity(ai, {
                              no_risks_reason: e.target.value,
                            })
                          }
                        />
                      </label>
                    )}
                  </div>
                  {activity.risks.map((risk, ri) => {
                    const score = riskScore(risk.probability, risk.severity);
                    const residual = riskScore(
                      risk.residual_probability,
                      risk.residual_severity,
                    );
                    return (
                      <article className="live-risk" key={risk.id}>
                        <div className="live-title">
                          <h4>
                            <ShieldCheck size={17} /> {es ? "Riesgo" : "Risk"}{" "}
                            {ai + 1}.{ri + 1}
                          </h4>
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() =>
                              updateActivity(ai, {
                                risks: activity.risks.filter(
                                  (_, i) => i !== ri,
                                ),
                              })
                            }
                          >
                            <Trash2 size={16} />
                            {es ? "Quitar" : "Remove"}
                          </button>
                        </div>
                        <div className="live-grid form-columns">
                          <label>
                            {es ? "Dimensión" : "Dimension"}
                            <select
                              value={risk.dimension}
                              onChange={(e) =>
                                updateRisk(ai, ri, {
                                  dimension: e.target
                                    .value as Risk["dimension"],
                                })
                              }
                            >
                              <option value="environmental">
                                {es ? "Ambiental" : "Environmental"}
                              </option>
                              <option value="social">Social</option>
                            </select>
                          </label>
                          <label>
                            {es ? "Riesgo o impacto" : "Risk or impact"}
                            <input
                              value={risk.name}
                              onChange={(e) =>
                                updateRisk(ai, ri, { name: e.target.value })
                              }
                            />
                          </label>
                          <label className="full-width">
                            {es
                              ? "Descripción concisa del riesgo"
                              : "Concise risk description"}
                            <textarea
                              rows={2}
                              value={risk.description}
                              onChange={(e) =>
                                updateRisk(ai, ri, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </label>
                          {scale(
                            es
                              ? "Probabilidad inicial (1–5)"
                              : "Initial probability (1–5)",
                            risk.probability,
                            (n) => updateRisk(ai, ri, { probability: n }),
                          )}
                          {scale(
                            es
                              ? "Gravedad inicial (1–5)"
                              : "Initial severity (1–5)",
                            risk.severity,
                            (n) => updateRisk(ai, ri, { severity: n }),
                          )}
                        </div>
                        <div className={"risk-result " + riskLevel(score)}>
                          {es ? "Puntaje inicial" : "Initial score"}:{" "}
                          <strong>
                            {score ?? "—"} · {levels[locale][riskLevel(score)]}
                          </strong>
                        </div>
                        <section className="measure-section">
                          <h4>
                            {es
                              ? "Salvaguardas o medidas"
                              : "Safeguards or measures"}
                          </h4>
                          {!catalog.length && (
                            <p className="field-help">
                              {es
                                ? "El catálogo oficial aún no está habilitado. Las medidas que describa se registrarán como propuestas para validación del GLF."
                                : "The official catalog is not yet enabled. Measures you describe will be recorded as proposals for GLF validation."}
                            </p>
                          )}
                          {risk.measures.map((m, mi) => (
                            <div className="measure-row" key={mi}>
                              {m.catalog_id ? (
                                <p>
                                  {(es
                                    ? catalog.find((c) => c.id === m.catalog_id)
                                        ?.label_es
                                    : catalog.find((c) => c.id === m.catalog_id)
                                        ?.label_en) || m.catalog_id}
                                  <small>
                                    {
                                      catalog.find((c) => c.id === m.catalog_id)
                                        ?.normative_reference
                                    }
                                  </small>
                                </p>
                              ) : (
                                <label>
                                  {es ? "Medida propuesta" : "Proposed measure"}
                                  <textarea
                                    rows={2}
                                    value={m.text || ""}
                                    onChange={(e) =>
                                      updateRisk(ai, ri, {
                                        measures: risk.measures.map((x, i) =>
                                          i === mi
                                            ? { text: e.target.value }
                                            : x,
                                        ),
                                      })
                                    }
                                  />
                                </label>
                              )}
                              <button
                                type="button"
                                className="button ghost"
                                aria-label={
                                  es ? "Quitar medida" : "Remove measure"
                                }
                                onClick={() =>
                                  updateRisk(ai, ri, {
                                    measures: risk.measures.filter(
                                      (_, i) => i !== mi,
                                    ),
                                  })
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <div className="live-actions">
                            <button
                              type="button"
                              className="button secondary"
                              onClick={() =>
                                updateRisk(ai, ri, {
                                  measures: [...risk.measures, { text: "" }],
                                })
                              }
                            >
                              <Plus size={16} />
                              {es
                                ? "Añadir medida propuesta"
                                : "Add proposed measure"}
                            </button>
                            {catalog.length > 0 && (
                              <select
                                aria-label={
                                  es
                                    ? "Agregar salvaguarda del catálogo"
                                    : "Add catalog safeguard"
                                }
                                value=""
                                onChange={(e) => {
                                  if (
                                    e.target.value &&
                                    !risk.measures.some(
                                      (m) => m.catalog_id === e.target.value,
                                    )
                                  )
                                    updateRisk(ai, ri, {
                                      measures: [
                                        ...risk.measures,
                                        { catalog_id: e.target.value },
                                      ],
                                    });
                                }}
                              >
                                <option value="">
                                  {es
                                    ? "Seleccionar del catálogo"
                                    : "Select from catalog"}
                                </option>
                                {catalog.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {es ? c.label_es : c.label_en}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </section>
                        <div className="live-grid form-columns">
                          {scale(
                            es
                              ? "Probabilidad residual (1–5)"
                              : "Residual probability (1–5)",
                            risk.residual_probability,
                            (n) =>
                              updateRisk(ai, ri, { residual_probability: n }),
                          )}
                          {scale(
                            es
                              ? "Gravedad residual (1–5)"
                              : "Residual severity (1–5)",
                            risk.residual_severity,
                            (n) => updateRisk(ai, ri, { residual_severity: n }),
                          )}
                          <label>
                            {es ? "Ubicación" : "Location"}
                            <input
                              value={risk.location}
                              onChange={(e) =>
                                updateRisk(ai, ri, { location: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            {es
                              ? "Costo estimado (USD)"
                              : "Estimated cost (USD)"}
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={risk.cost ?? ""}
                              onChange={(e) =>
                                updateRisk(ai, ri, {
                                  cost:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                            />
                          </label>
                          <label className="full-width">
                            {es
                              ? "Responsable de la medida"
                              : "Person responsible for the measure"}
                            <input
                              value={risk.responsible}
                              onChange={(e) =>
                                updateRisk(ai, ri, {
                                  responsible: e.target.value,
                                })
                              }
                            />
                          </label>
                          {quarter(
                            es ? "Trimestre inicial" : "Start quarter",
                            risk.start_quarter,
                            (n) => updateRisk(ai, ri, { start_quarter: n }),
                          )}
                          {quarter(
                            es ? "Trimestre final" : "End quarter",
                            risk.end_quarter,
                            (n) => updateRisk(ai, ri, { end_quarter: n }),
                          )}
                        </div>
                        <div className={"risk-result " + riskLevel(residual)}>
                          {es ? "Puntaje residual" : "Residual score"}:{" "}
                          <strong>
                            {residual ?? "—"} ·{" "}
                            {levels[locale][riskLevel(residual)]}
                          </strong>
                          <span>
                            {es ? "Duración" : "Duration"}:{" "}
                            {risk.end_quarter &&
                            risk.start_quarter &&
                            risk.end_quarter >= risk.start_quarter
                              ? risk.end_quarter - risk.start_quarter + 1
                              : "—"}{" "}
                            {es ? "trimestres" : "quarters"}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      updateActivity(ai, {
                        risks: [...activity.risks, newRisk()],
                      })
                    }
                  >
                    <Plus size={16} />
                    {es
                      ? "Agregar riesgo a esta actividad"
                      : "Add a risk to this activity"}
                  </button>
                </section>
              ))}
              <button
                type="button"
                className="button primary"
                onClick={() =>
                  setPayload((p) => ({
                    ...p,
                    activities: [...p.activities, newActivity()],
                  }))
                }
              >
                <Plus size={16} />
                {es ? "Agregar actividad" : "Add activity"}
              </button>
              <div className="live-notice">
                <p>
                  {es
                    ? "Suma de puntajes individuales"
                    : "Sum of individual scores"}
                  : <strong>{initialTotal}</strong>.{" "}
                  {es
                    ? "La categoría global será confirmada por Sostenibilidad GLF. Esta suma no asigna una categoría automática."
                    : "The overall category will be confirmed by GLF Sustainability. This sum does not assign an automatic category."}
                </p>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="live-form">
              <h2>{es ? "Revisión del expediente" : "Application review"}</h2>
              <dl className="summary-list">
                {[...identityFields, ...narrativeFields].map((f) => (
                  <div key={f.key}>
                    <dt>{es ? f.es : f.en}</dt>
                    <dd>{String(payload.concept[f.key] ?? "—") || "—"}</dd>
                  </div>
                ))}
              </dl>
              <p>
                {payload.activities.length} {es ? "actividades" : "activities"}{" "}
                · {payload.activities.flatMap((a) => a.risks).length}{" "}
                {es ? "riesgos" : "risks"}
              </p>
              <h3>
                {es
                  ? "Aviso de privacidad de la convocatoria"
                  : "Call privacy notice"}
              </h3>
              <p className="preserve-text">
                {es ? rules.privacy_es : rules.privacy_en}
              </p>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={payload.truthful}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, truthful: e.target.checked }))
                  }
                />
                {es
                  ? "Confirmo que la información refleja la propuesta que presento."
                  : "I confirm that this information reflects the proposal I am submitting."}
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={payload.consent}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, consent: e.target.checked }))
                  }
                />
                {es
                  ? "He leído y acepto el aviso de privacidad de esta convocatoria."
                  : "I have read and accept this call's privacy notice."}
              </label>
            </div>
          )}
        </div>
      </fieldset>
      {step === 3 && (
        <section className="live-card">
          <h2>{es ? "Anexos separados" : "Separate attachments"}</h2>
          {documents.map((d) => (
            <div className="document-row" key={d.id}>
              <span>
                {d.file_name} · {d.kind}
              </span>
              <a href={"/files/" + d.id}>{es ? "Descargar" : "Download"}</a>
            </div>
          ))}
          {editable && (
            <form onSubmit={upload} className="live-form">
              <label>
                {es ? "Tipo de anexo" : "Attachment type"}
                <select name="kind">
                  {[...new Set(["other", ...rules.required_attachments])].map(
                    (k) => (
                      <option value={k} key={k}>
                        {k === "other"
                          ? es
                            ? "Otro anexo"
                            : "Other attachment"
                          : k}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                {es ? "Archivo (máximo 4 MB)" : "File (maximum 4 MB)"}
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                  required
                />
              </label>
              <button className="button secondary" disabled={busy}>
                {es ? "Guardar anexo" : "Save attachment"}
              </button>
            </form>
          )}
        </section>
      )}
      {editable && (
        <div className="editor-footer">
          <span role="status">
            {dirty
              ? es
                ? "Cambios sin guardar"
                : "Unsaved changes"
              : es
                ? "Todos los cambios guardados"
                : "All changes saved"}
          </span>
          <div className="live-actions">
            <button
              className="button secondary"
              disabled={busy || !dirty}
              onClick={() => persist()}
            >
              <Save size={16} />
              {busy
                ? es
                  ? "Guardando…"
                  : "Saving…"
                : es
                  ? "Guardar borrador"
                  : "Save draft"}
            </button>
            {step === 3 ? (
              <button
                className="button primary"
                disabled={busy}
                onClick={() => persist(true)}
              >
                <Send size={16} />
                {es ? "Enviar al GLF" : "Submit to GLF"}
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => setStep((s) => Math.min(s + 1, 3))}
              >
                {es ? "Continuar" : "Continue"} →
              </button>
            )}
          </div>
        </div>
      )}
      {versions.length > 0 && (
        <section className="live-card">
          <h2>{es ? "Versiones presentadas" : "Submitted versions"}</h2>
          <p>
            {es
              ? "Los PDF se generan desde la copia inmutable de cada envío. Sus enlaces requieren ingresar con una cuenta autorizada."
              : "PDFs are generated from each submission's immutable snapshot. Their links require an authorized account."}
          </p>
          {versions.map((v) => (
            <div className="document-row" key={v.id}>
              <span>
                {es ? "Versión" : "Version"} {v.revision} ·{" "}
                {es ? "Fase" : "Phase"} {v.stage}
              </span>
              <div className="live-actions">
                <a
                  className="button secondary"
                  href={"/documents/" + v.id + "/concept"}
                >
                  <FileDown size={16} />
                  {es ? "Nota Conceptual" : "Concept Note"}
                </a>
                <a
                  className="button secondary"
                  href={"/documents/" + v.id + "/matrix"}
                >
                  <FileDown size={16} />
                  {es ? "Matriz A&S" : "E&S matrix"}
                </a>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
