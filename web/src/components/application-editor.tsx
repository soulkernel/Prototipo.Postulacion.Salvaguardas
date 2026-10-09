"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { PhoneField } from "./phone-field";
import { PartnerFields } from "./partner-fields";
import { partnerText } from "@/lib/partners";
import { RequiredMark } from "./required-mark";
import { stepIssues } from "@/lib/step-validation";
import { GeographyFields } from "./geography-fields";
import { SummaryFields } from "./summary-fields";
import { StrategicFields } from "./strategic-fields";
import { PotentialRiskFields } from "./potential-risk-fields";
import { riskCode } from "@/lib/potential-risks";
import { strategicText } from "@/lib/strategic-alignment";
import { ActionLabel } from "./submit-button";
import { summaryText, summarySections } from "@/lib/summary";
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
import {
  saveDraft,
  submitDraft,
  prepareDocuments,
} from "@/app/applicant/actions";
import { identityFields, narrativeFields, statusLabel } from "@/lib/fields";
import {
  newActivity,
  newRisk,
  riskScore,
  riskLevel,
  validateComplete,
  financialErrors,
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
  if (code.includes("RISK_REGISTER") || code.includes("RISK_REFERENCE"))
    return es
      ? "Revise los riesgos registrados: cada riesgo debe vincularse con al menos una actividad y calificarse sin duplicados."
      : "Check registered risks: link each risk to at least one activity and assess it without duplicates.";
  if (code.includes("ALIGNMENT"))
    return es
      ? "Complete los objetivos, la contribución esperada y la alineación del proyecto con Plan Galápagos 2030, ODS y GLF."
      : "Complete objectives, expected contribution and project alignment with Plan Galápagos 2030, SDGs and GLF.";
  if (code.includes("SUMMARY"))
    return es
      ? "Complete las seis secciones del resumen y respete el límite total de palabras."
      : "Complete all six summary sections and respect the total word limit.";
  if (code.includes("GEOGRAPHY"))
    return es
      ? "Complete provincia, ciudad o localidad e islas de ejecución; especifique las otras islas si las seleccionó."
      : "Complete province, city or locality and project islands; specify other islands if selected.";
  if (code.includes("PHONE"))
    return es
      ? "Revise el teléfono: seleccione el país e ingrese un número celular o convencional válido."
      : "Check the phone: select a country and enter a valid mobile or landline number.";
  if (code.includes("SIGNED_CONCEPT"))
    return es
      ? "Adjunte la Nota Conceptual firmada en PDF después de preparar los documentos."
      : "Attach the signed Concept Note PDF after preparing documents.";
  if (code.includes("PREPARE_DOCUMENTS"))
    return es
      ? "Prepare los documentos de la versión actual antes de enviar."
      : "Prepare documents for the current version before submitting.";
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
  accountEmail = "",
  catalog,
  versions,
  documents: initialDocuments,
  saveAction = saveDraft,
}: {
  application: Application;
  call: Call;
  locale: Locale;
  editable: boolean;
  accountEmail?: string;
  catalog: Catalog[];
  versions: Version[];
  documents: DocumentRow[];
  saveAction?: typeof saveDraft;
}) {
  const es = locale === "es";
  const router = useRouter();
  const [payload, setPayload] = useState<Payload>(() =>
    editable && !application.payload.concept.email.trim() && accountEmail
      ? {
          ...application.payload,
          concept: { ...application.payload.concept, email: accountEmail },
        }
      : application.payload,
  );
  const [revision, setRevision] = useState(application.revision);
  const [saved, setSaved] = useState(JSON.stringify(application.payload));
  const revisionRef = useRef(application.revision);
  const autoFlight = useRef<Promise<void> | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoError, setAutoError] = useState("");
  const [lastSaved, setLastSaved] = useState(application.updated_at);
  const [step, setStep] = useState(editable ? 0 : 3);
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState<
    "save" | "submit" | "upload" | "prepare"
  >("save");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [checkedStep, setCheckedStep] = useState<number | null>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [prepared, setPrepared] = useState<{
    id: string;
    revision: number;
  } | null>(null);
  const dirty = JSON.stringify(payload) !== saved;
  useEffect(() => {
    if (!editable || !dirty || busy || autoSaving || autoError) return;
    const timer = setTimeout(() => {
      const snapshot = payload,
        serialized = JSON.stringify(snapshot);
      setAutoSaving(true);
      const task = (async () => {
        try {
          const result = await saveAction(
            application.id,
            revisionRef.current,
            snapshot,
          );
          if (!result.ok) {
            setAutoError(result.error);
            return;
          }
          revisionRef.current = result.revision;
          setRevision(result.revision);
          setSaved(serialized);
          setLastSaved(new Date().toISOString());
          setPrepared(null);
        } catch {
          setAutoError("GLF_SAVE_FAILED");
        } finally {
          setAutoSaving(false);
          autoFlight.current = null;
        }
      })();
      autoFlight.current = task;
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    payload,
    saved,
    dirty,
    busy,
    autoSaving,
    autoError,
    editable,
    application.id,
    saveAction,
  ]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    const leave = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest?.("a[href]");
      if (
        anchor &&
        !anchor.hasAttribute("download") &&
        !window.confirm(
          es
            ? "Hay cambios sin guardar. ¿Desea salir de esta página?"
            : "There are unsaved changes. Leave this page?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", leave, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", leave, true);
    };
  }, [dirty, es]);
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
      <RequiredMark locale={locale} />
      <select
        aria-required="true"
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
    </label>
  );
  const quarter = (
    label: string,
    value: number | null,
    onChange: (n: number | null) => void,
  ) => (
    <label>
      {label}
      <RequiredMark locale={locale} />
      <select
        aria-required="true"
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
      const missing = validateComplete(
        payload,
        application.rules_snapshot,
        application.stage,
      );
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
    setOperation(submit ? "submit" : "save");
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      if (autoFlight.current) await autoFlight.current;
      let nextRevision = revisionRef.current;
      if (dirty) {
        const result = await saveAction(application.id, nextRevision, payload);
        if (!result.ok) {
          setError(message(result.error, es));
          return;
        }
        nextRevision = result.revision;
        revisionRef.current = nextRevision;
        setRevision(nextRevision);
        setSaved(JSON.stringify(payload));
        setAutoError("");
        setLastSaved(new Date().toISOString());
        setPrepared(null);
      }
      if (submit) {
        const result = await submitDraft(application.id, nextRevision);
        if (!result.ok) {
          setError(message(result.error, es));
          return;
        }
        setRevision(result.revision);
        revisionRef.current = result.revision;
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
    setOperation("upload");
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
  const currentIssues =
    checkedStep === step
      ? stepIssues(payload, rules, application.stage, step, call.phase2_schema)
      : { missing: [], invalid: [] };
  const fieldIssue = (key: string) =>
    currentIssues.missing.includes(key) || currentIssues.invalid.includes(key);
  const issueLabel = (key: string) => {
    if (key === "risk_unlinked")
      return es
        ? "Vincule cada riesgo registrado con al menos una actividad"
        : "Link each registered risk to at least one activity";
    if (key === "potential_risks")
      return es
        ? "Complete cada riesgo registrado"
        : "Complete each registered risk";
    if (key.startsWith("summary:")) {
      const s = summarySections.find((s) => s.key === key.slice(8));
      return (es ? "Resumen: " : "Summary: ") + (s ? (es ? s.es : s.en) : key);
    }
    const field = [...identityFields, ...narrativeFields].find(
      (f) => f.key === key,
    );
    if (field) return es ? field.es : field.en;
    if (key === "applicant_type")
      return es ? "Tipo de solicitante" : "Applicant type";
    if (key === "category_id")
      return es ? "Categoría de subvención" : "Grant category";
    if (key.startsWith("phase2:")) {
      const f = call.phase2_schema.find((f) => f.id === key.slice(7));
      return f ? (es ? f.label_es : f.label_en) : key;
    }
    if (key === "activities")
      return es ? "Al menos una actividad" : "At least one activity";
    const numbers = key.match(/\d+/g)?.join(".") || "";
    return (
      (key.startsWith("no_risks_reason")
        ? es
          ? "Justificación sin riesgos, actividad "
          : "No-risk explanation, activity "
        : key.startsWith("activity_")
          ? es
            ? "Nombre y descripción, actividad "
            : "Name and description, activity "
          : es
            ? "Campos del riesgo o trimestres, actividad/riesgo "
            : "Risk fields or quarters, activity/risk ") + numbers
    );
  };
  const financial = financialErrors(payload.concept, rules);
  const selectedCategory = rules.categories.find(
    (c) => c.id === payload.concept.category_id,
  );
  const totalCost =
    (payload.concept.requested_amount || 0) +
    (payload.concept.cofinance_amount || 0);
  const adminLimit = (totalCost * rules.max_admin_percent) / 100;
  const currency = (amount: number) =>
    amount.toLocaleString(locale, { style: "currency", currency: "USD" });
  const financialHelp = (key: keyof Concept) =>
    key === "requested_amount" && selectedCategory
      ? (es ? "Monto permitido: " : "Allowed amount: ") +
        currency(selectedCategory.min_amount) +
        (selectedCategory.max_amount !== null
          ? " – " + currency(selectedCategory.max_amount)
          : es
            ? " en adelante"
            : " and above")
      : key === "admin_cost"
        ? (es ? "Máximo: " : "Maximum: ") +
          currency(adminLimit) +
          " (" +
          rules.max_admin_percent +
          (es ? "% del costo total)." : "% of total cost).")
        : key === "cofinance_amount" && selectedCategory
          ? (es ? "Cofinanciamiento mínimo: " : "Minimum cofinancing: ") +
            currency(
              ((payload.concept.requested_amount || 0) *
                selectedCategory.cofinance_percent) /
                100,
            )
          : "";
  const initialTotal = payload.activities
    .flatMap((a) => a.risks)
    .reduce((sum, r) => sum + (riskScore(r.probability, r.severity) || 0), 0);
  return (
    <>
      <Link href="/applicant/applications" className="text-button">
        ← {es ? "Mis postulaciones" : "My applications"}
      </Link>
      <div className="live-title">
        <div>
          <p className="eyebrow">
            {application.reference_code} · {es ? "Fase" : "Phase"}{" "}
            {application.stage}
          </p>
          <h1 className="application-form-title">
            {application.stage === 1
              ? es
                ? "Formulario de Nota Conceptual"
                : "Concept Note Form"
              : es
                ? "Formulario de Proyecto Completo"
                : "Full Proposal Form"}
          </h1>
          {payload.concept.title.trim() && (
            <p className="application-project-title">
              {es ? "Proyecto: " : "Project: "}
              {payload.concept.title}
            </p>
          )}
          <p>
            {es ? call.title_es : call.title_en} · {es ? "Reglas" : "Rules"}{" "}
            {rules.version || call.rules_version}
          </p>
        </div>
        <div className="application-save-heading">
          <span className="status-pill neutral">
            {statusLabel(application.status, locale)}
          </span>
          {editable && (
            <span
              className="application-save-time"
              role="status"
              aria-live="polite"
            >
              <ActionLabel
                busy={autoSaving || (busy && operation === "save")}
                pendingLabel={es ? "Guardando…" : "Saving…"}
              >
                {autoError ? (
                  es ? (
                    "No guardado"
                  ) : (
                    "Not saved"
                  )
                ) : dirty ? (
                  es ? (
                    "Cambios sin guardar"
                  ) : (
                    "Unsaved changes"
                  )
                ) : (
                  <>
                    {es ? "Guardado " : "Saved "}
                    <time dateTime={lastSaved}>
                      {new Date(lastSaved)
                        .toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hourCycle: "h23",
                          timeZone: "Pacific/Galapagos",
                        })
                        .replace(",", "")}
                    </time>
                  </>
                )}
              </ActionLabel>
            </span>
          )}
        </div>
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
      <p className="field-help required-fields-help">
        <RequiredMark locale={locale} />{" "}
        {es
          ? "Campo obligatorio para enviar la postulación. Puede guardar un borrador incompleto. Los campos opcionales se indican expresamente."
          : "Required to submit the application. You can save an incomplete draft. Optional fields are explicitly identified."}
      </p>
      <nav
        className="wizard-tabs"
        aria-label={es ? "Pasos de la postulación" : "Application steps"}
      >
        {(es
          ? [
              "Datos generales",
              application.stage === 1 ? "Nota Conceptual" : "Proyecto completo",
              "Actividades y riesgos",
              "Revisar y enviar",
            ]
          : [
              "Project details",
              application.stage === 1 ? "Concept Note" : "Full proposal",
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
      {error && !editable && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
      {feedback && (
        <p className="auth-success" role="status">
          {feedback}
        </p>
      )}
      {editable && (
        <aside className="live-card draft-save-status">
          <p>
            {es ? (
              <>
                Su avance se guarda automáticamente después de dejar de
                escribir. Puede salir y postergar la consignación de los datos
                de su nota conceptual, y continuar después desde este o
                cualquier dispositivo, accediendo desde la opción del menú:{" "}
                <strong>Mis postulaciones</strong> →{" "}
                <strong>Continuar borrador</strong>. Solo se enviará la nota
                conceptual final, cuando pulse Enviar al GLF.
              </>
            ) : (
              <>
                Your progress is saved automatically after you stop typing. You
                can leave and postpone entering your concept note information,
                then continue later from this or any other device using the menu
                option: <strong>My applications</strong> →{" "}
                <strong>Continue draft</strong>. Your final concept note will
                only be submitted when you select Submit to GLF.
              </>
            )}
          </p>
          {autoError && (
            <p role="alert">
              <ActionLabel
                busy={autoSaving || (busy && operation === "save")}
                pendingLabel={es ? "Guardando…" : "Saving…"}
              >
                {autoError
                  ? autoError === "GLF_VERSION_CONFLICT" ||
                    autoError === "GLF_REVISION_CONFLICT"
                    ? es
                      ? "El borrador cambió en otra sesión. Actualice la página antes de continuar."
                      : "This draft changed in another session. Refresh before continuing."
                    : es
                      ? "No se pudieron guardar los cambios. Revise su conexión y pulse Guardar borrador para volver a intentarlo."
                      : "Changes could not be saved. Check your connection and select Save draft to retry."
                  : dirty
                    ? es
                      ? "Cambios sin guardar"
                      : "Unsaved changes"
                    : (es ? "Borrador guardado · " : "Draft saved · ") +
                      new Date(lastSaved).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Pacific/Galapagos",
                      })}
              </ActionLabel>
            </p>
          )}
        </aside>
      )}
      {application.deletion_pending && (
        <p role="alert">
          {es
            ? "Este borrador está pendiente de eliminación. Complete la eliminación desde Mis postulaciones."
            : "This draft is pending deletion. Complete deletion from My applications."}
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
                    <RequiredMark locale={locale} />
                    <select
                      aria-required="true"
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
                    <RequiredMark locale={locale} />
                    <select
                      aria-required="true"
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
                {fields.map((field) =>
                  field.key === "environmental_risks" ? (
                    <PotentialRiskFields
                      key={field.key}
                      payload={payload}
                      locale={locale}
                      onChange={setPayload}
                    />
                  ) : field.key === "social_risks" ? null : field.key ===
                    "summary" ? (
                    <SummaryFields
                      key={field.key}
                      parts={payload.concept.summary_parts}
                      legacy={payload.concept.summary}
                      limit={rules.summary_word_limit}
                      locale={locale}
                      onChange={(parts) =>
                        setPayload((p) => ({
                          ...p,
                          concept: {
                            ...p.concept,
                            summary_parts: parts,
                            summary: summaryText(parts),
                          },
                        }))
                      }
                    />
                  ) : [
                      "province",
                      "city",
                      "project_islands",
                      "other_islands",
                    ].includes(field.key) ? null : field.key === "address" ||
                    field.key === "location" ? (
                    <GeographyFields
                      key={field.key}
                      concept={payload.concept}
                      locale={locale}
                      mode={field.key === "address" ? "address" : "project"}
                      onChange={(patch) =>
                        setPayload((p) => ({
                          ...p,
                          concept: { ...p.concept, ...patch },
                        }))
                      }
                    />
                  ) : field.key === "objectives" ? (
                    <StrategicFields
                      key={field.key}
                      value={payload.concept.strategic_alignment}
                      legacy={
                        payload.concept.objectives +
                        "\n" +
                        payload.concept.alignment
                      }
                      locale={locale}
                      onChange={(value) =>
                        setPayload((p) => ({
                          ...p,
                          activities: p.activities.map((a) => ({
                            ...a,
                            objective_ids: a.objective_ids?.filter((id) =>
                              value.objectives.some(
                                (o) => o.id === id && o.kind === "specific",
                              ),
                            ),
                          })),
                          concept: {
                            ...p.concept,
                            strategic_alignment: value,
                            ...strategicText(value, locale),
                          },
                        }))
                      }
                    />
                  ) : field.key === "partners" ? (
                    <PartnerFields
                      key={field.key}
                      concept={payload.concept}
                      locale={locale}
                      invalid={fieldIssue("partners")}
                      onChange={(names) =>
                        setPayload((p) => ({
                          ...p,
                          concept: {
                            ...p.concept,
                            associated_organizations: names,
                            partners: partnerText(names),
                          },
                        }))
                      }
                    />
                  ) : field.key === "alignment" ? null : field.key ===
                    "phone" ? (
                    <PhoneField
                      key={field.key}
                      locale={locale}
                      value={payload.concept.phone}
                      onChange={(value) => updateConcept("phone", value)}
                    />
                  ) : (
                    <label
                      key={field.key}
                      className={field.type === "textarea" ? "full-width" : ""}
                    >
                      {es ? field.es : field.en}
                      <RequiredMark locale={locale} />
                      {field.type === "textarea" ? (
                        <textarea
                          aria-required="true"
                          aria-invalid={fieldIssue(field.key)}
                          rows={4}
                          maxLength={12000}
                          value={String(payload.concept[field.key] ?? "")}
                          onChange={(e) =>
                            updateConcept(field.key, e.target.value)
                          }
                        />
                      ) : (
                        <input
                          aria-required="true"
                          type={field.type || "text"}
                          min={field.type === "number" ? 0 : undefined}
                          max={
                            field.key === "requested_amount"
                              ? (selectedCategory?.max_amount ?? undefined)
                              : field.key === "admin_cost"
                                ? adminLimit
                                : undefined
                          }
                          aria-invalid={
                            Boolean(financial[field.key]) ||
                            fieldIssue(field.key)
                          }
                          step={field.type === "number" ? "0.01" : undefined}
                          maxLength={
                            field.type === "date" || field.type === "number"
                              ? undefined
                              : 12000
                          }
                          value={String(payload.concept[field.key] ?? "")}
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
                      {financialHelp(field.key) && (
                        <small>{financialHelp(field.key)}</small>
                      )}
                      {currentIssues.missing.includes(field.key) && (
                        <small className="error">
                          {es
                            ? "Complete este campo obligatorio."
                            : "Complete this required field."}
                        </small>
                      )}
                      {financial[field.key] && (
                        <span className="error" role="alert">
                          {message(financial[field.key]!, es)}
                        </span>
                      )}
                      {field.type === "textarea" && (
                        <small>
                          {words(String(payload.concept[field.key] || ""))}{" "}
                          {es ? "palabras" : "words"} ·{" "}
                          {String(
                            payload.concept[field.key] || "",
                          ).length.toLocaleString(locale)}{" "}
                          / 12.000 {es ? "caracteres" : "characters"}
                        </small>
                      )}
                    </label>
                  ),
                )}
              </div>
              {step === 0 && (
                <div className="activity-card" aria-live="polite">
                  <span>
                    {es ? "Costo total estimado" : "Estimated total cost"}
                  </span>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "1.8rem",
                      marginTop: "0.3rem",
                    }}
                  >
                    {currency(totalCost)}
                  </strong>
                  <small>
                    {es
                      ? "Monto solicitado al GLF + cofinanciamiento"
                      : "GLF requested amount + cofinancing"}
                  </small>
                </div>
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
                      {f.required ? (
                        <RequiredMark locale={locale} />
                      ) : (
                        <small> ({es ? "Opcional" : "Optional"})</small>
                      )}
                      <textarea
                        aria-required={f.required}
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
                  ? application.stage === 1
                    ? "Screening: actividades y riesgos A&S"
                    : "Evaluación completa de riesgos y PGAS"
                  : application.stage === 1
                    ? "Screening: activities and E&S risks"
                    : "Full risk assessment and ESMP"}
              </h2>
              <p>
                {es
                  ? "Identifique y evalúe los riesgos de cada actividad. La mitigación y el PGAS se completan en la Fase 2. Si no identifica riesgos, justifíquelo."
                  : "Identify and assess risks for each activity. Mitigation and the ESMP are completed in Phase 2. If you identify no risks, explain why."}
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
                    {payload.concept.strategic_alignment && (
                      <fieldset className="full-width strategic-fields">
                        <legend>
                          {es
                            ? "Objetivos específicos a los que contribuye esta actividad"
                            : "Specific objectives this activity contributes to"}
                        </legend>
                        {payload.concept.strategic_alignment.objectives
                          .filter((o) => o.kind === "specific")
                          .map((o, i) => (
                            <label
                              key={o.id}
                              style={{ display: "flex", gap: 8 }}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  activity.objective_ids?.includes(o.id) ||
                                  false
                                }
                                onChange={() =>
                                  updateActivity(ai, {
                                    objective_ids:
                                      activity.objective_ids?.includes(o.id)
                                        ? activity.objective_ids.filter(
                                            (id) => id !== o.id,
                                          )
                                        : [
                                            ...(activity.objective_ids || []),
                                            o.id,
                                          ],
                                  })
                                }
                              />
                              OE{i + 1} · {o.text}
                            </label>
                          ))}
                      </fieldset>
                    )}
                    <label>
                      {es ? "Nombre de actividad" : "Activity name"}
                      <RequiredMark locale={locale} />
                      <input
                        aria-required="true"
                        value={activity.title}
                        onChange={(e) =>
                          updateActivity(ai, { title: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      {es ? "Descripción" : "Description"}
                      <RequiredMark locale={locale} />
                      <textarea
                        aria-required="true"
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
                        <RequiredMark locale={locale} />
                        <textarea
                          aria-required="true"
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
                            {risk.source_id && (
                              <>
                                {" "}
                                ·{" "}
                                {riskCode(
                                  payload.concept.risk_register || [],
                                  risk.source_id,
                                )}
                              </>
                            )}
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
                          {payload.concept.risk_register && (
                            <label className="full-width">
                              {es
                                ? "Seleccione un riesgo registrado"
                                : "Select a registered risk"}
                              <RequiredMark locale={locale} />
                              <select
                                aria-required="true"
                                value={risk.source_id || ""}
                                onChange={(e) => {
                                  const source =
                                    payload.concept.risk_register?.find(
                                      (r) => r.id === e.target.value,
                                    );
                                  updateRisk(
                                    ai,
                                    ri,
                                    source
                                      ? {
                                          source_id: source.id,
                                          name: source.name,
                                          dimension: source.dimension,
                                          probability: null,
                                          severity: null,
                                          residual_probability: null,
                                          residual_severity: null,
                                        }
                                      : {
                                          source_id: undefined,
                                          name: "",
                                          probability: null,
                                          severity: null,
                                          residual_probability: null,
                                          residual_severity: null,
                                        },
                                  );
                                }}
                              >
                                <option value="">
                                  {es ? "Seleccione" : "Select"}
                                </option>
                                {payload.concept.risk_register
                                  .filter(
                                    (r) =>
                                      r.name.trim() &&
                                      (!activity.risks.some(
                                        (x) => x.source_id === r.id,
                                      ) ||
                                        risk.source_id === r.id),
                                  )
                                  .map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {riskCode(
                                        payload.concept.risk_register!,
                                        r.id,
                                      )}{" "}
                                      · {r.name}
                                    </option>
                                  ))}
                              </select>
                              <small>
                                {es
                                  ? "El puntaje corresponde a este riesgo en esta actividad. Si cambia el riesgo seleccionado, vuelva a calificarlo."
                                  : "The score applies to this risk in this activity. Reassess it if you change the selected risk."}
                              </small>
                            </label>
                          )}
                          <label>
                            {es ? "Dimensión" : "Dimension"}
                            <RequiredMark locale={locale} />
                            <select
                              aria-required="true"
                              value={risk.dimension}
                              disabled={Boolean(payload.concept.risk_register)}
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
                            <RequiredMark locale={locale} />
                            <input
                              aria-required="true"
                              value={risk.name}
                              readOnly={Boolean(payload.concept.risk_register)}
                              onChange={(e) =>
                                updateRisk(ai, ri, { name: e.target.value })
                              }
                            />
                          </label>
                          <label className="full-width">
                            {es
                              ? "Descripción concisa del riesgo"
                              : "Concise risk description"}
                            <RequiredMark locale={locale} />
                            <textarea
                              aria-required="true"
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
                        {application.stage === 2 && (
                          <>
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
                                        ? catalog.find(
                                            (c) => c.id === m.catalog_id,
                                          )?.label_es
                                        : catalog.find(
                                            (c) => c.id === m.catalog_id,
                                          )?.label_en) || m.catalog_id}
                                      <small>
                                        {
                                          catalog.find(
                                            (c) => c.id === m.catalog_id,
                                          )?.normative_reference
                                        }
                                      </small>
                                    </p>
                                  ) : (
                                    <label>
                                      {es
                                        ? "Medida propuesta"
                                        : "Proposed measure"}
                                      <RequiredMark locale={locale} />
                                      <textarea
                                        aria-required="true"
                                        rows={2}
                                        value={m.text || ""}
                                        onChange={(e) =>
                                          updateRisk(ai, ri, {
                                            measures: risk.measures.map(
                                              (x, i) =>
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
                                      measures: [
                                        ...risk.measures,
                                        { text: "" },
                                      ],
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
                                          (m) =>
                                            m.catalog_id === e.target.value,
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
                                  updateRisk(ai, ri, {
                                    residual_probability: n,
                                  }),
                              )}
                              {scale(
                                es
                                  ? "Gravedad residual (1–5)"
                                  : "Residual severity (1–5)",
                                risk.residual_severity,
                                (n) =>
                                  updateRisk(ai, ri, { residual_severity: n }),
                              )}
                              <label>
                                {es ? "Ubicación" : "Location"}
                                <RequiredMark locale={locale} />
                                <input
                                  aria-required="true"
                                  value={risk.location}
                                  onChange={(e) =>
                                    updateRisk(ai, ri, {
                                      location: e.target.value,
                                    })
                                  }
                                />
                              </label>
                              <label>
                                {es
                                  ? "Costo estimado (USD)"
                                  : "Estimated cost (USD)"}
                                <RequiredMark locale={locale} />
                                <input
                                  aria-required="true"
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
                                <RequiredMark locale={locale} />
                                <input
                                  aria-required="true"
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
                            <div
                              className={"risk-result " + riskLevel(residual)}
                            >
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
                          </>
                        )}
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
                  aria-required="true"
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, truthful: e.target.checked }))
                  }
                />
                {es
                  ? "Confirmo que la información refleja la propuesta que presento."
                  : "I confirm that this information reflects the proposal I am submitting."}
                <RequiredMark locale={locale} />
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={payload.consent}
                  aria-required="true"
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, consent: e.target.checked }))
                  }
                />
                {es
                  ? "He leído y acepto el aviso de privacidad de esta convocatoria."
                  : "I have read and accept this call's privacy notice."}
                <RequiredMark locale={locale} />
              </label>
            </div>
          )}
        </div>
      </fieldset>
      {step === 3 && editable && (
        <section className="live-card">
          <h2>
            {es ? "Preparar, firmar y adjuntar" : "Prepare, sign and attach"}
          </h2>
          <p>
            {es
              ? "Guarde todos los campos y declaraciones. Prepare los documentos, descargue la Nota Conceptual y la evaluación A&S por separado, firme electrónicamente la Nota Conceptual fuera del portal y adjunte el PDF firmado. Si modifica el formulario, deberá preparar y firmar nuevamente. La validez de la firma será revisada por GLF."
              : "Save all fields and declarations. Prepare and download the Concept Note and E&S screening separately, sign the Concept Note electronically outside this portal and attach the signed PDF. After editing, prepare and sign again. GLF will review signature validity."}
          </p>
          <button
            className="button secondary"
            disabled={busy || dirty}
            aria-busy={busy && operation === "prepare"}
            onClick={async () => {
              if (busy) return;
              setOperation("prepare");
              setBusy(true);
              setError("");
              try {
                const result = await prepareDocuments(application.id, revision);
                if (result.id) setPrepared({ id: result.id, revision });
                else setError(message(result.error || "", es));
              } catch {
                setError(message("", es));
              } finally {
                setBusy(false);
              }
            }}
          >
            <ActionLabel
              busy={busy && operation === "prepare"}
              pendingLabel={es ? "Preparando…" : "Preparing…"}
            >
              {es
                ? "Preparar documentos para firma"
                : "Prepare documents for signing"}
            </ActionLabel>
          </button>
          {prepared && prepared.revision === revision && !dirty && (
            <div className="live-actions">
              <a
                className="button secondary"
                href={`/documents/${prepared.id}/concept?prepared=1&lang=${locale}`}
              >
                {es ? "Descargar Nota Conceptual" : "Download Concept Note"}
              </a>
              <a
                className="button secondary"
                href={`/documents/${prepared.id}/matrix?prepared=1&lang=${locale}`}
              >
                {es ? "Descargar evaluación A&S" : "Download E&S screening"}
              </a>
            </div>
          )}
        </section>
      )}
      {step === 3 && (
        <section className="live-card">
          <h2>{es ? "Anexos separados" : "Separate attachments"}</h2>
          <p className="field-help">
            {es ? "Anexos obligatorios: " : "Required attachments: "}
            {[
              ...(application.stage === 1
                ? [
                    es
                      ? "Nota Conceptual firmada (PDF)"
                      : "Signed Concept Note (PDF)",
                  ]
                : []),
              ...rules.required_attachments,
            ].join(", ") || (es ? "Ninguno adicional" : "None additional")}
          </p>
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
                <RequiredMark locale={locale} />
                <select name="kind">
                  {[
                    ...new Set([
                      "concept_signed",
                      "other",
                      ...rules.required_attachments,
                    ]),
                  ].map((k) => (
                    <option value={k} key={k}>
                      {k === "concept_signed"
                        ? es
                          ? "Nota Conceptual firmada (PDF)"
                          : "Signed Concept Note (PDF)"
                        : k === "other"
                          ? es
                            ? "Otro anexo"
                            : "Other attachment"
                          : k}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {es ? "Archivo (máximo 4 MB)" : "File (maximum 4 MB)"}
                <RequiredMark locale={locale} />
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                  required
                />
              </label>
              <button
                className="button secondary"
                disabled={busy}
                aria-busy={busy && operation === "upload"}
              >
                <ActionLabel
                  busy={busy && operation === "upload"}
                  pendingLabel={es ? "Guardando anexo…" : "Saving attachment…"}
                >
                  {es ? "Guardar anexo" : "Save attachment"}
                </ActionLabel>
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
          <div className="editor-action-feedback">
            {error && (
              <div
                id="application-action-error"
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="live-actions">
              <button
                className="button secondary"
                disabled={busy || !dirty}
                aria-busy={busy && operation === "save"}
                onClick={() => persist()}
              >
                <ActionLabel
                  busy={busy && operation === "save"}
                  pendingLabel={es ? "Guardando…" : "Saving…"}
                >
                  <Save size={16} />
                  {es ? "Guardar borrador" : "Save draft"}
                </ActionLabel>
              </button>
              {step === 3 ? (
                <button
                  className="button primary"
                  disabled={busy}
                  aria-busy={busy && operation === "submit"}
                  onClick={() => persist(true)}
                  aria-describedby={
                    error ? "application-action-error" : undefined
                  }
                >
                  <ActionLabel
                    busy={busy && operation === "submit"}
                    pendingLabel={
                      es ? "Enviando al GLF…" : "Submitting to GLF…"
                    }
                  >
                    <Send size={16} />
                    {es ? "Enviar al GLF" : "Submit to GLF"}
                  </ActionLabel>
                </button>
              ) : (
                <button
                  className="button primary"
                  aria-describedby={
                    error ? "application-action-error" : undefined
                  }
                  onClick={() => {
                    setCheckedStep(step);
                    const issues = stepIssues(
                      payload,
                      rules,
                      application.stage,
                      step,
                      call.phase2_schema,
                    );
                    if (issues.missing.length || issues.invalid.length) {
                      setError(
                        [
                          issues.missing.length
                            ? (es
                                ? "Complete los campos obligatorios: "
                                : "Complete required fields: ") +
                              issues.missing.map(issueLabel).join("; ")
                            : "",
                          issues.invalid.length
                            ? (es
                                ? "Corrija los valores: "
                                : "Correct these values: ") +
                              issues.invalid
                                .map(
                                  (key) =>
                                    issueLabel(key) +
                                    (financial[key as keyof Concept]
                                      ? " — " +
                                        message(
                                          financial[key as keyof Concept]!,
                                          es,
                                        )
                                      : ""),
                                )
                                .join("; ")
                            : "",
                        ]
                          .filter(Boolean)
                          .join("\n"),
                      );
                      return;
                    }
                    setError("");
                    setStep((s) => Math.min(s + 1, 3));
                  }}
                >
                  {es ? "Continuar" : "Continue"} →
                </button>
              )}
            </div>
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
