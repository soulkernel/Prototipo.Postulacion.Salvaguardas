"use client";
import { narrativeTextForEditing } from "@/lib/concept-presentation";
import { ConceptReview } from "./concept-review";
import { MonitoringFields } from "./monitoring-fields";
import { monitoredObjectiveIds } from "@/lib/monitoring-plan";
import { ApplicationTopicSelect } from "./application-topic-select";
import { applicationTopicMessage } from "@/lib/call-themes";
import { ConfirmRemoveButton } from "./confirm-remove-button";
import { RequiredAttachmentUploads } from "./required-attachment-uploads";
import {
  applicationAttachments,
  missingPartnerLetters,
  partnerLetterError,
  partnerLetterPrefix,
  isPartnerLetterDocument,
} from "@/lib/attachment-requirements";
import { FileDropField } from "./file-drop-field";
import { LimitedTextarea } from "./limited-textarea";
import { NarrativeTextarea } from "./narrative-textarea";
import { MoneyInput } from "./money-input";
import { DeadlineCountdown } from "./deadline-countdown";
import { DocumentDownload } from "./document-download";
import { useEffect, useState, useRef } from "react";
import { proposalEntryPrompt, proposalTitle } from "@/lib/proposal-guidance";
import { ProposalFieldGuidance } from "./proposal-field-guidance";
import { applicationStepUrl } from "@/lib/application-navigation";
import Link from "@/components/feedback-link";
import { SignedDocumentUpload } from "./signed-document-upload";
import { ReceiptDownload } from "./receipt-download";
import {
  privacyNotice,
  submissionConfirmation,
  submissionPhase,
} from "@/lib/applicant-copy";
import { PhoneField } from "./phone-field";
import { ActivityPlanningFields } from "./activity-planning-fields";
import { PartnerFields } from "./partner-fields";
import {
  initializePartners,
  partnerPatch,
  partnerRecords,
} from "@/lib/partners";
import { RequiredMark } from "./required-mark";
import { GrantCategorySelect } from "./grant-category-select";
import { CompletionFeedback } from "./completion-feedback";
import {
  completionGuidance,
  type CompletionIssue,
} from "@/lib/completion-guidance";
import { submissionProgress } from "@/lib/submission-progress";
import { stepIssues } from "@/lib/step-validation";
import { GeographyFields } from "./geography-fields";
import { applicantTypeAddressPatch } from "@/lib/geography";
import { SummaryFields } from "./summary-fields";
import { StrategicFields } from "./strategic-fields";
import { ProjectResultFields } from "./project-result-fields";
import { resultText } from "@/lib/project-results";
import { BudgetFields } from "./budget-fields";
import { budgetTotals, budgetYears } from "@/lib/budget";
import {
  financialFeedback,
  isMoneyField,
  type MoneyField,
} from "@/lib/financial-feedback";
import { RiskReferenceTable } from "./risk-reference-table";
import { RiskOverview } from "./risk-overview";
import { PotentialRiskFields } from "./potential-risk-fields";
import { riskLabel } from "@/lib/potential-risks";
import {
  identificationIssue,
  identificationIssues,
  projectDateErrors,
  maxProjectEnd,
  projectDurationText,
} from "@/lib/applicant-validation";
import { currentAlignmentVersion } from "@/lib/strategic-alignment";
import { strategicText } from "@/lib/strategic-alignment";
import { ActionLabel } from "./submit-button";
import { projectSummary, emptySummary } from "@/lib/summary";
import { useRouter } from "next/navigation";
import { Plus, Save, Send, ShieldCheck, LockKeyhole } from "lucide-react";
import {
  saveDraft,
  removePartner,
  submitDraft,
  prepareDocuments,
} from "@/app/applicant/actions";
import {
  identityFields,
  identityFieldsForStage,
  narrativeFields,
  statusLabel,
} from "@/lib/fields";
import { currentConceptLayout } from "@/lib/concept-layout";
import {
  newRisk,
  riskScore,
  riskLevel,
  validateComplete,
  financialErrors,
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
  concept_layout_version?: string | null;
  project_title?: string;
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
  protected?: boolean;
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
  if (code.includes("GLF_INVALID_MONITORING"))
    return es
      ? "Revise las fichas de seguimiento y evaluación antes de volver a guardar."
      : "Review the monitoring and evaluation cards before saving again.";
  if (code.includes("GLF_REQUIRED:monitoring"))
    return es
      ? "Complete el parámetro, el registro asociado, el indicador y la estrategia de cada ficha de seguimiento y evaluación. Revise sus vínculos con los objetivos."
      : "Complete the parameter, associated record, indicator and strategy for each monitoring and evaluation card. Check their objective links.";
  if (code.includes("GLF_INVALID_RESULTS"))
    return es
      ? "Revise los resultados y sus datos guardados antes de volver a guardar el borrador."
      : "Check the results and their saved data before saving the draft again.";
  if (code.includes("GLF_REQUIRED:result"))
    return es
      ? "Complete los campos de resultados requeridos en esta fase y seleccione un objetivo específico válido para cada resultado."
      : "Complete the result fields required in this phase and select a valid specific objective for each result.";
  if (code.includes("GLF_REQUIRED:partners"))
    return es
      ? "Complete el nombre y describa el apoyo de cada organización asociada en la implementación del proyecto."
      : "Complete the name and implementation support of each partner organization.";
  if (code.includes("GLF_CALL_THEMES_REQUIRED"))
    return applicationTopicMessage(
      "GLF_CALL_THEMES_REQUIRED",
      es ? "es" : "en",
    );
  if (code.includes("GLF_INVALID_PROJECT_THEME"))
    return applicationTopicMessage(
      "GLF_INVALID_PROJECT_THEME",
      es ? "es" : "en",
    );
  if (code.includes("GLF_INVALID_PARTNERS"))
    return es
      ? "Revise los nombres y la identificación de las organizaciones asociadas y vuelva a guardar el borrador."
      : "Check partner organization names and identifiers, then save the draft again.";
  if (code.includes("GLF_PARTNER_LINK_REQUIRED"))
    return es
      ? "Guarde y revise las organizaciones asociadas antes de vincular sus cartas de apoyo."
      : "Save and review partner organizations before linking their letters of support.";
  if (code.includes("GLF_ORGANIZATION_PROVINCE"))
    return es
      ? "Para una organización, la provincia del domicilio debe ser Galápagos. Corrija la provincia y revise la ciudad o localidad antes de guardar."
      : "For an organization, the address province must be Galápagos. Correct the province and review the city or locality before saving.";
  if (code.includes("GLF_INDIVIDUAL_SMALL_ONLY"))
    return es
      ? "Las personas naturales solo pueden solicitar subvención pequeña, hasta USD 100.000. Revise el tipo de solicitante, la categoría y el monto."
      : "Individuals may only apply for a small grant, up to USD 100,000. Check the applicant type, category and amount.";
  if (code.includes("ATTACHMENT_FORMAT"))
    return es
      ? "El formato de este anexo no está permitido. Revise los formatos indicados junto al documento y vuelva a cargarlo."
      : "This attachment format is not allowed. Check the listed formats and upload it again.";
  if (code.includes("ATTACHMENT_REQUIRED"))
    return es
      ? "Falta un anexo obligatorio. Revise la lista de documentos requeridos."
      : "A required attachment is missing. Review the required documents.";
  if (code.includes("ATTACHMENT_UNREADABLE"))
    return es
      ? "No se pudo comprobar un anexo requerido. Vuelva a cargarlo o intente nuevamente."
      : "A required attachment could not be checked. Upload it again or retry.";
  if (code.includes("SUBMISSION_UNAVAILABLE"))
    return es
      ? "No se pudo confirmar el envío por un problema técnico del sistema. Sus documentos continúan guardados. Revise el estado en Mis postulaciones antes de volver a enviar; si persiste, contacte al GLF indicando la referencia del expediente."
      : "Your submission could not be confirmed due to a technical system issue. Your documents remain saved. Check the status in My applications before trying again; if the problem persists, contact GLF with your application reference.";
  if (code.includes("SIGNATURE_MISSING"))
    return es
      ? "Atención: no se detectó una firma electrónica incorporada en su anexo. Presentarlo sin firma podría ser motivo de descalificación de su postulación de nota conceptual. Firme electrónicamente el PDF y vuelva a cargarlo."
      : "Warning: no embedded electronic signature was detected in your attachment. Submitting it unsigned could result in disqualification of your concept note application. Electronically sign the PDF and upload it again.";
  if (code.includes("SIGNATURE_UNREADABLE"))
    return es
      ? "No se pudo comprobar la firma electrónica del anexo. Use un PDF válido, sin contraseña, con la firma incorporada y vuelva a cargarlo."
      : "The attachment's electronic signature could not be checked. Upload a valid, password-free PDF with an embedded signature.";
  if (code.includes("RISK_REGISTER") || code.includes("RISK_REFERENCE"))
    return es
      ? "Revise los riesgos registrados: cada riesgo debe vincularse con al menos una actividad y calificarse sin duplicados."
      : "Check registered risks: link each risk to at least one activity and assess it without duplicates.";
  if (code.includes("ALIGNMENT"))
    return es
      ? "Complete los objetivos y la alineación del objetivo general con Plan Galápagos 2030 y ODS."
      : "Complete objectives and the general objective alignment with Plan Galápagos 2030 and SDGs.";
  if (code.includes("SUMMARY"))
    return es
      ? "Complete el resumen del proyecto y respete el límite de palabras."
      : "Complete the project summary and respect the word limit.";
  if (code.includes("GEOGRAPHY"))
    return es
      ? "Complete provincia, ciudad o localidad e islas de ejecución; especifique las otras islas si las seleccionó."
      : "Complete province, city or locality and project islands; specify other islands if selected.";
  if (code.includes("PHONE"))
    return es
      ? "Revise el teléfono: seleccione el país e ingrese un número celular o convencional válido."
      : "Check the phone: select a country and enter a valid mobile or landline number.";
  if (code.includes("SIGNED_MATRIX"))
    return es
      ? "Adjunte la evaluación de riesgos ambientales y sociales firmada en PDF de la versión vigente."
      : "Attach the signed environmental and social risk assessment PDF for the current version.";
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
  if (code.includes("RUC_REQUIRED"))
    return es
      ? "Ingrese el RUC de 13 dígitos de la organización."
      : "Enter the organization 13-digit RUC.";
  if (code.includes("IDENTITY_NUMBER"))
    return es
      ? "Ingrese los 10 dígitos de su cédula de identidad, sin espacios ni guiones."
      : "Enter the 10 digits of your identity card number, without spaces or hyphens.";
  if (code.includes("RESIDENCE_REQUIRED"))
    return es
      ? "Ingrese el número de credencial de residencia permanente."
      : "Enter the permanent residence card number.";
  if (code.includes("INVALID_DATES"))
    return es
      ? "La finalización del proyecto debe ser posterior al inicio."
      : "The project end must follow its start.";
  if (code.includes("CATEGORY_AMOUNT") || code.includes("CATEGORY_DURATION"))
    return es
      ? "Revise el monto y las fechas según la categoría seleccionada."
      : "Check the amount and dates against the selected grant category.";
  if (code.includes("QUARTER") || code.includes("OUTSIDE_PROJECT"))
    return es
      ? "Revise los trimestres: deben estar en orden y dentro de la duración del proyecto."
      : "Check the quarters: they must be ordered and within the project duration.";
  if (code.includes("ACTIVITY_DATE"))
    return es
      ? "Revise las fechas de las actividades: complete ambas o deje ambas vacías; deben estar ordenadas y dentro del período del proyecto."
      : "Review activity dates: complete both or leave both blank; dates must be in order and within the project period.";
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
  academicReadOnly = false,
  serverNow,
  accountEmail = "",
  catalog,
  versions,
  documents: initialDocuments,
  initialPrepared = null,
  saveAction = saveDraft,
  removePartnerAction = removePartner,
  initialPendingPartner = null,
  initialStep = 0,
}: {
  application: Application;
  call: Call;
  locale: Locale;
  editable: boolean;
  academicReadOnly?: boolean;
  serverNow: number;
  accountEmail?: string;
  catalog: Catalog[];
  versions: Version[];
  documents: DocumentRow[];
  initialPrepared?: { id: string; revision: number; created_at: string } | null;
  saveAction?: typeof saveDraft;
  removePartnerAction?: typeof removePartner;
  initialPendingPartner?: string | null;
  initialStep?: number;
}) {
  const es = locale === "es";
  const router = useRouter();
  const [payload, setPayload] = useState<Payload>(() => {
    const initialPayload: Payload =
      editable &&
      application.payload.concept.strategic_alignment?.version !==
        currentAlignmentVersion &&
      application.payload.concept.strategic_alignment
        ? {
            ...application.payload,
            concept: {
              ...application.payload.concept,
              email: application.payload.concept.email || accountEmail,
              strategic_alignment: {
                ...application.payload.concept.strategic_alignment,
                version: currentAlignmentVersion,
                objectives:
                  application.payload.concept.strategic_alignment.objectives.map(
                    (o) => ({
                      ...o,
                      glf: [],
                      ...(o.kind === "specific" ? { plan: [], ods: [] } : {}),
                    }),
                  ),
              },
            },
          }
        : editable && !application.payload.concept.email.trim() && accountEmail
          ? {
              ...application.payload,
              concept: { ...application.payload.concept, email: accountEmail },
            }
          : application.payload;
    return editable &&
      initialPayload.concept.partner_organizations === undefined &&
      partnerRecords(initialPayload.concept).length
      ? {
          ...initialPayload,
          concept: {
            ...initialPayload.concept,
            ...partnerPatch(initializePartners(initialPayload.concept)),
          },
        }
      : initialPayload;
  });
  const [revision, setRevision] = useState(application.revision);
  const [saved, setSaved] = useState(JSON.stringify(application.payload));
  const revisionRef = useRef(application.revision);
  const autoFlight = useRef<Promise<void> | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoError, setAutoError] = useState("");
  const [lastSaved, setLastSaved] = useState(application.updated_at);
  const [step, setStepState] = useState(
    editable || academicReadOnly ? initialStep : 3,
  );
  function setStep(next: number) {
    setStepState(next);
    window.history.replaceState(
      null,
      "",
      applicationStepUrl(window.location.href, next),
    );
  }
  const [busy, setBusy] = useState(false);
  const [pendingPartner, setPendingPartner] = useState(initialPendingPartner);
  const removalFlight = useRef(false);
  const [budgetUiValid, setBudgetUiValid] = useState(true);
  const [operation, setOperation] = useState<
    "save" | "submit" | "upload" | "prepare" | "remove-partner"
  >("save");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionAttempt, setCompletionAttempt] = useState(0);
  useEffect(() => {
    if (!completionAttempt) return;
    const summary = document.querySelector<HTMLElement>(".completion-summary");
    summary?.scrollIntoView({ block: "center", behavior: "smooth" });
    summary?.focus({ preventScroll: true });
  }, [completionAttempt]);
  const [focusIssue, setFocusIssue] = useState<CompletionIssue | null>(null);
  const [checkedStep, setCheckedStep] = useState<number | null>(null);
  const [moneyTouched, setMoneyTouched] = useState<
    Partial<Record<MoneyField, boolean>>
  >({});
  const [moneyFocused, setMoneyFocused] = useState<MoneyField | null>(null);
  const [invalidMoneyEntries, setInvalidMoneyEntries] = useState<
    Partial<Record<MoneyField, boolean>>
  >({});
  const [moneyInputText, setMoneyInputText] = useState<
    Partial<Record<MoneyField, string>>
  >({});
  const moneyTextValid = !Object.values(invalidMoneyEntries).some(Boolean);
  const fundingErrors = financialErrors(
    payload.concept,
    application.rules_snapshot,
    application.stage,
  );
  const moneyUiValid =
    moneyTextValid &&
    !fundingErrors.requested_amount &&
    !fundingErrors.cofinance_amount;
  const moneyActionError = es
    ? "Revise los importes marcados y corríjalos para continuar."
    : "Check the highlighted amounts and correct them to continue.";
  const [identityTouched, setIdentityTouched] = useState(false);
  const [identityFocused, setIdentityFocused] = useState(false);
  const [documents, setDocuments] = useState(initialDocuments);
  const [prepared, setPrepared] = useState<{
    id: string;
    revision: number;
    created_at: string;
  } | null>(initialPrepared);
  const dirty = JSON.stringify(payload) !== saved || !moneyTextValid;
  const signedDocumentsReady =
    application.stage !== 1 ||
    Boolean(
      prepared &&
      prepared.revision === revision &&
      !dirty &&
      ["concept_signed", "matrix_signed"].every((kind) =>
        documents.some(
          (d) =>
            d.kind === kind &&
            Date.parse(d.created_at) >= Date.parse(prepared.created_at),
        ),
      ),
    );
  useEffect(() => {
    if (
      !editable ||
      !dirty ||
      !moneyUiValid ||
      busy ||
      autoSaving ||
      autoError ||
      pendingPartner
    )
      return;
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
    moneyUiValid,
    busy,
    autoSaving,
    autoError,
    editable,
    application.id,
    saveAction,
    pendingPartner,
  ]);
  async function removePartnerRow(partnerId: string) {
    if ((!editable && !pendingPartner) || removalFlight.current) return;
    if (!pendingPartner && (!checkMoneyEntries() || !budgetUiValid))
      throw new Error(moneyActionError);
    removalFlight.current = true;
    setOperation("remove-partner");
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      if (autoFlight.current) await autoFlight.current;
      if (!pendingPartner && dirty) {
        const savedResult = await saveAction(
          application.id,
          revisionRef.current,
          payload,
        );
        if (!savedResult.ok) throw new Error(message(savedResult.error, es));
        revisionRef.current = savedResult.revision;
        setRevision(savedResult.revision);
        setSaved(JSON.stringify(payload));
        setAutoError("");
      }
      setPendingPartner(partnerId);
      const result = await removePartnerAction(
        application.id,
        revisionRef.current,
        partnerId,
      );
      if (!result.ok) {
        if (!result.pending) setPendingPartner(null);
        throw new Error(
          result.pending
            ? es
              ? "La eliminación está pendiente. Reinténtela para completar el retiro de la organización y su carta."
              : "Deletion is pending. Retry to finish removing the organization and its letter."
            : message(result.error, es),
        );
      }
      revisionRef.current = result.revision;
      setRevision(result.revision);
      setPayload(result.payload);
      setSaved(JSON.stringify(result.payload));
      setDocuments((rows) =>
        rows.filter(
          (d) =>
            d.protected ||
            d.kind !==
              partnerLetterPrefix + partnerId.replaceAll("-", "").toLowerCase(),
        ),
      );
      setPendingPartner(null);
      setAutoError("");
      setLastSaved(new Date().toISOString());
    } catch (cause) {
      const explanation =
        cause instanceof Error
          ? cause.message
          : es
            ? "No se pudo completar la eliminación. Reinténtela."
            : "Deletion could not be completed. Please retry.";
      setError(explanation);
      throw new Error(explanation);
    } finally {
      removalFlight.current = false;
      setBusy(false);
    }
  }
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
    setPayload((p) => ({
      ...p,
      concept: {
        ...p.concept,
        ...(key === "applicant_type"
          ? applicantTypeAddressPatch(p.concept, String(value || ""))
          : { [key]: value }),
      },
    }));
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
      <span className="field-label">
        {label}
        <RequiredMark locale={locale} />
      </span>
      <select
        aria-required="true"
        data-validation-field={
          /residual/i.test(label)
            ? /probab/i.test(label)
              ? "residual_probability"
              : "residual_severity"
            : /probab/i.test(label)
              ? "probability"
              : /gravedad|severity/i.test(label)
                ? "severity"
                : /inicio|start/i.test(label)
                  ? "start_quarter"
                  : "end_quarter"
        }
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
      <span className="field-label">
        {label}
        <RequiredMark locale={locale} />
      </span>
      <select
        aria-required="true"
        data-validation-field={
          /residual/i.test(label)
            ? /probab/i.test(label)
              ? "residual_probability"
              : "residual_severity"
            : /probab/i.test(label)
              ? "probability"
              : /gravedad|severity/i.test(label)
                ? "severity"
                : /inicio|start/i.test(label)
                  ? "start_quarter"
                  : "end_quarter"
        }
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
    if (pendingPartner) {
      setError(
        es
          ? "Complete la eliminación pendiente antes de guardar o enviar."
          : "Complete the pending deletion before saving or submitting.",
      );
      return;
    }
    if (!checkMoneyEntries()) return;
    if (!budgetUiValid) {
      setError(
        es
          ? "Revise los importes del presupuesto: use como máximo dos decimales."
          : "Check budget amounts: use at most two decimals.",
      );
      setStep(0);
      return;
    }
    if (submit) {
      const missingLetters = missingPartnerLetters(
        payload.concept,
        application.rules_snapshot,
        documents,
      );
      if (missingLetters.length) {
        setStep(3);
        setError(
          (es ? "Falta cargar: " : "Upload: ") +
            missingLetters
              .map((r) => (es ? r.label_es : r.label_en))
              .join("; "),
        );
        return;
      }
      setShowCompletion(true);
      setCompletionAttempt((n) => n + 1);
      if (
        completionGuidance(
          payload,
          application.rules_snapshot,
          application.stage,
          call.phase2_schema,
          locale,
        ).length
      ) {
        setStep(3);
        return;
      }
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
                if (key.startsWith("activity_objectives_"))
                  return (
                    (es
                      ? "Objetivos específicos de la actividad "
                      : "Specific objectives for activity ") +
                    key.split("_").at(-1)
                  );
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
      }
      if (submit) {
        const result = await submitDraft(application.id, nextRevision);
        if (!result.ok) {
          setError(
            partnerLetterError(result.error, payload.concept, locale) ||
              message(result.error, es),
          );
          return;
        }
        setRevision(result.revision);
        revisionRef.current = result.revision;
        if (result.receiptId)
          router.replace(
            `/applicant/${application.id}?receipt=${result.receiptId}`,
          );
        else router.refresh();
      } else
        setFeedback(
          es
            ? "Borrador guardado en su cuenta."
            : "Draft saved to your account.",
        );
    } catch {
      setError(message(submit ? "GLF_SUBMISSION_UNAVAILABLE" : "", es));
    } finally {
      setBusy(false);
    }
  }
  async function uploadForm(form: HTMLFormElement) {
    if (busy) return;
    setOperation("upload");
    setBusy(true);
    setError("");
    const data = new FormData(form);
    if (
      String(data.get("kind")).startsWith(partnerLetterPrefix) &&
      (dirty || autoSaving)
    ) {
      setError(message("GLF_PARTNER_LINK_REQUIRED", es));
      setBusy(false);
      return;
    }
    if (
      application.stage === 1 &&
      ["concept_signed", "matrix_signed"].includes(String(data.get("kind")))
    ) {
      if (!prepared || prepared.revision !== revisionRef.current || dirty) {
        setError(message("GLF_PREPARE_DOCUMENTS_REQUIRED", es));
        setBusy(false);
        return;
      }
      data.set("revision", String(revisionRef.current));
    }
    data.set("application_id", application.id);
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(
          result.error?.startsWith("GLF_")
            ? message(result.error, es)
            : ["concept_signed", "matrix_signed"].includes(
                  String(data.get("kind")),
                )
              ? es
                ? "No se pudo adjuntar el documento. Use un PDF de hasta 4 MB con un nombre válido y prepare la versión vigente antes de cargarlo."
                : "Could not attach the document. Use a PDF up to 4 MB with a valid filename and prepare the current version before uploading."
              : es
                ? "No se pudo adjuntar el archivo. Use PDF, PNG, JPEG, DOCX o XLSX de hasta 4 MB, con un nombre válido."
                : "Could not attach the file. Use PDF, PNG, JPEG, DOCX or XLSX up to 4 MB with a valid filename.",
        );
        return;
      }
      setDocuments((d) => [result, ...d]);
      form.reset();
      setFeedback(
        es
          ? "Documento guardado · pendiente de verificación por el GLF."
          : "Document saved · GLF verification pending.",
      );
    } catch {
      setError(message("", es));
    } finally {
      setBusy(false);
    }
  }
  const fields =
    step === 0 ? identityFieldsForStage(application.stage) : narrativeFields;
  const rules = application.rules_snapshot;
  const missingLetters = missingPartnerLetters(
    payload.concept,
    rules,
    documents,
  );
  const progress = submissionProgress(
    payload,
    rules,
    application.stage,
    call.phase2_schema,
    documents,
    signedDocumentsReady,
    !dirty,
  );
  const completion = showCompletion
    ? completionGuidance(
        payload,
        rules,
        application.stage,
        call.phase2_schema,
        locale,
      )
    : [];
  const goToIssue = (issue: CompletionIssue) => {
    if (!checkMoneyEntries()) return;
    setStep(issue.step);
    setCheckedStep(issue.step);
    setFocusIssue({ ...issue });
    setError("");
  };
  const currentIssues =
    showCompletion || checkedStep === step
      ? stepIssues(payload, rules, application.stage, step, call.phase2_schema)
      : { missing: [], invalid: [] };
  const fieldIssue = (key: string) =>
    currentIssues.missing.includes(key) || currentIssues.invalid.includes(key);
  const issueLabel = (key: string) => {
    if (key === "other_instruments")
      return es
        ? "Otros instrumentos: complete el nombre y el objetivo de cada instrumento añadido"
        : "Other instruments: complete each added instrument's name and objective";
    if (key === "ruc")
      return es
        ? "RUC de la organización: ingrese 13 dígitos"
        : "Organization RUC: enter 13 digits";
    if (key === "identity_number")
      return es
        ? "Cédula de identidad: ingrese 10 dígitos"
        : "Identity card number: enter 10 digits";
    if (key === "residence_number")
      return es
        ? "Número de credencial de residencia permanente"
        : "Permanent residence card number";
    if (key.startsWith("budget_"))
      return es
        ? "Presupuesto anual: revise años, partidas y totales"
        : "Annual budget: check years, lines and totals";
    if (key === "risk_unlinked")
      return es
        ? "Vincule cada riesgo registrado con al menos una actividad"
        : "Link each registered risk to at least one activity";
    if (key === "potential_risks")
      return es
        ? "Complete cada riesgo registrado"
        : "Complete each registered risk";
    if (key.startsWith("summary:"))
      return es ? "Resumen del proyecto" : "Project summary";
    const field = [...identityFields, ...narrativeFields].find(
      (f) => f.key === key,
    );
    if (field) return es ? field.es : field.en;
    if (key === "applicant_type")
      return es ? "Tipo de solicitante" : "Applicant type";
    if (key === "category_id")
      return es ? "Categoría de subvención" : "Grant category";
    if (key.startsWith("result_"))
      return (
        (es ? "Complete resultado " : "Complete result ") +
        key.split("_").at(-1)
      );
    if (key.startsWith("phase2:")) {
      const f = call.phase2_schema.find((f) => f.id === key.slice(7));
      return f ? (es ? f.label_es : f.label_en) : key;
    }
    if (key.startsWith("activity_dates_"))
      return (
        (es
          ? "Revise las fechas de la actividad "
          : "Review dates for activity ") + key.split("_").at(-1)
      );
    if (key.startsWith("activity_objectives_"))
      return (
        (es
          ? "Seleccione objetivos específicos para la actividad "
          : "Select specific objectives for activity ") + key.split("_").at(-1)
      );
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
  const financial = {
    ...financialErrors(payload.concept, rules, application.stage),
    ...projectDateErrors(payload.concept, rules),
  };
  const identification = identificationIssue(payload.concept);
  const identityInvalid =
    identificationIssues(payload.concept).includes("identity_number") &&
    !identityFocused &&
    (identityTouched || showCompletion || checkedStep === 0);
  const selectedCategory = rules.categories.find(
    (c) => c.id === payload.concept.category_id,
  );
  const categoryMonthsEs =
    selectedCategory?.max_months === 12
      ? "doce"
      : selectedCategory?.max_months === 24
        ? "veinticuatro"
        : selectedCategory?.max_months === 36
          ? "treinta y seis"
          : selectedCategory?.max_months;
  const totalCost =
    (payload.concept.requested_amount || 0) +
    (payload.concept.cofinance_amount || 0);
  const adminLimit = (totalCost * rules.max_admin_percent) / 100;
  const currency = (amount: number) =>
    amount.toLocaleString(locale, { style: "currency", currency: "USD" });
  const moneyFeedback = financialFeedback(
    payload.concept,
    rules,
    locale,
    moneyTouched,
    moneyFocused,
    showCompletion || checkedStep === 0,
    application.stage,
    moneyInputText,
  );
  const financialHelp = (key: keyof Concept) =>
    isMoneyField(key) ? moneyFeedback[key].text : "";
  const visibleFinancialError = (key: keyof Concept) =>
    isMoneyField(key) ? moneyFeedback[key].invalid : Boolean(financial[key]);
  function checkMoneyEntries() {
    if (moneyUiValid) return true;
    setError(moneyActionError);
    setCheckedStep(0);
    setMoneyTouched({ requested_amount: true, cofinance_amount: true });
    setStep(0);
    const key = (["requested_amount", "cofinance_amount"] as const).find(
      (k) => invalidMoneyEntries[k] || fundingErrors[k],
    );
    requestAnimationFrame(() =>
      document.getElementById(`money-${key}`)?.focus(),
    );
    return false;
  }
  const dateError = financial.start_date || financial.end_date;
  const durationText = projectDurationText(
    payload.concept.start_date,
    payload.concept.end_date,
    locale,
  );
  const renderField = (field: (typeof fields)[number]) =>
    field.key === "environmental_risks" ? (
      <PotentialRiskFields
        key={field.key}
        payload={payload}
        locale={locale}
        onChange={setPayload}
      />
    ) : ["social_risks", "monitoring"].includes(
        field.key,
      ) ? null : field.key === "summary" ? (
      <SummaryFields
        key={field.key}
        value={projectSummary(payload.concept)}
        invalid={fieldIssue("summary")}
        limit={rules.summary_word_limit}
        locale={locale}
        onChange={(value) =>
          setPayload((p) => ({
            ...p,
            concept: {
              ...p.concept,
              summary_parts: { ...emptySummary },
              summary: value,
            },
          }))
        }
      />
    ) : ["province", "city", "project_islands", "other_islands"].includes(
        field.key,
      ) ? null : field.key === "address" || field.key === "location" ? (
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
        monitoredObjectives={monitoredObjectiveIds(payload)}
        key={field.key}
        value={payload.concept.strategic_alignment}
        legacy={payload.concept.objectives + "\n" + payload.concept.alignment}
        locale={locale}
        onChange={(value) =>
          setPayload((p) => {
            const specificIds = new Set(
              value.objectives
                .filter((o) => o.kind === "specific")
                .map((o) => o.id),
            );
            const removedIds = new Set(
              p.concept.strategic_alignment?.objectives
                .filter((o) => o.kind === "specific" && !specificIds.has(o.id))
                .map((o) => o.id),
            );
            const concept = {
              ...p.concept,
              strategic_alignment: value,
              project_results: p.concept.project_results?.map((r) => ({
                ...r,
                objective_id: removedIds.has(r.objective_id)
                  ? ""
                  : r.objective_id,
              })),
              ...strategicText(value, locale),
            };
            return {
              ...p,
              activities: p.activities.map((a) => ({
                ...a,
                objective_ids: a.objective_ids?.filter((id) =>
                  specificIds.has(id),
                ),
              })),
              concept: {
                ...concept,
                ...(removedIds.size && concept.project_results
                  ? { results: resultText(concept, locale, application.stage) }
                  : {}),
              },
            };
          })
        }
      />
    ) : field.key === "results" ? (
      <ProjectResultFields
        stage={application.stage}
        key={field.key}
        es={es}
        value={payload.concept.project_results}
        legacy={payload.concept.results_source ?? payload.concept.results}
        objectives={payload.concept.strategic_alignment?.objectives || []}
        monitoring={payload.concept.monitoring_plan}
        onLegacyChange={(text) =>
          setPayload((p) =>
            p.concept.project_results === undefined
              ? {
                  ...p,
                  concept: {
                    ...p.concept,
                    results: text,
                    results_source: text,
                  },
                }
              : p,
          )
        }
        onChange={(value) =>
          setPayload((p) => {
            const concept = {
              ...p.concept,
              project_results: value,
              results_source: p.concept.results_source ?? p.concept.results,
            };
            return {
              ...p,
              concept: {
                ...concept,
                results: resultText(concept, locale, application.stage),
              },
            };
          })
        }
      />
    ) : field.key === "partners" ? (
      <PartnerFields
        key={field.key}
        concept={payload.concept}
        locale={locale}
        invalid={fieldIssue("partners")}
        documents={documents}
        onRemove={removePartnerRow}
        onChange={(rows) =>
          setPayload((p) => ({
            ...p,
            concept: {
              ...p.concept,
              ...partnerPatch(rows),
            },
          }))
        }
      />
    ) : field.key === "alignment" ||
      field.key === "email" ||
      field.key === "phone" ? null : field.key === "contact_name" ? (
      <section
        key="contact-details"
        className="activity-card contact-details-card full-width"
        aria-labelledby="contact-details-heading"
      >
        <h3 id="contact-details-heading" className="section-card-title">
          {es ? "Datos de contacto" : "Contact details"}
        </h3>
        <div className="contact-details-grid">
          {(["contact_name", "email"] as const).map((key) => (
            <label
              key={key}
              className="editor-field"
              data-validation-field={key}
            >
              <span>
                {key === "contact_name"
                  ? es
                    ? "Persona de contacto"
                    : "Contact person"
                  : es
                    ? "Correo electrónico de contacto"
                    : "Contact email"}
                <RequiredMark locale={locale} />
              </span>
              <input
                type={key === "email" ? "email" : "text"}
                value={payload.concept[key]}
                maxLength={12000}
                aria-required="true"
                aria-invalid={fieldIssue(key)}
                aria-describedby={
                  currentIssues.missing.includes(key)
                    ? `field-required-${key}`
                    : undefined
                }
                onChange={(e) => updateConcept(key, e.target.value)}
              />
              {currentIssues.missing.includes(key) && (
                <small
                  className="field-warning"
                  data-field-message="error"
                  id={`field-required-${key}`}
                >
                  {es
                    ? "Complete este campo obligatorio."
                    : "Complete this required field."}
                </small>
              )}
            </label>
          ))}
          <PhoneField
            inline
            locale={locale}
            value={payload.concept.phone}
            onChange={(value) => updateConcept("phone", value)}
          />
        </div>
      </section>
    ) : ["beneficiaries", "sustainability", "monitoring"].includes(
        field.key,
      ) ? (
      <div
        key={field.key}
        data-validation-field={field.key}
        className="editor-field full-width narrative-field"
      >
        <label htmlFor={`concept-${field.key}`}>
          <span>
            {es ? field.es : field.en}
            <RequiredMark locale={locale} />
          </span>
        </label>
        <ProposalFieldGuidance
          field={field.key}
          locale={locale}
          id={`concept-${field.key}-help`}
        />
        <NarrativeTextarea
          placeholder={proposalEntryPrompt(field.key, locale)}
          descriptionId={`concept-${field.key}-help`}
          id={`concept-${field.key}`}
          label={es ? field.es : field.en}
          locale={locale}
          invalid={fieldIssue(field.key)}
          value={narrativeTextForEditing(
            String(payload.concept[field.key] ?? ""),
          )}
          onChange={(value) => updateConcept(field.key, value)}
        />
      </div>
    ) : (
      <label
        key={field.key}
        data-validation-field={field.key}
        className={`editor-field ${field.type === "textarea" || field.key === "title" ? "full-width" : ""}`}
      >
        <span>
          {es ? field.es : field.en}
          {(field.key !== "cofinance_amount" ||
            selectedCategory?.cofinance_percent !== 0) && (
            <RequiredMark locale={locale} />
          )}
        </span>
        {field.key === "project_type" ? (
          <ApplicationTopicSelect
            value={payload.concept.project_type}
            themes={rules.themes}
            locale={locale}
            invalid={fieldIssue(field.key)}
            onChange={(value) => updateConcept("project_type", value)}
          />
        ) : field.type === "textarea" ? (
          <LimitedTextarea
            placeholder={proposalEntryPrompt(field.key, locale)}
            locale={locale}
            aria-required="true"
            aria-invalid={fieldIssue(field.key)}
            rows={4}
            maxLength={12000}
            value={narrativeTextForEditing(
              String(payload.concept[field.key] ?? ""),
            )}
            onChange={(e) => updateConcept(field.key, e.target.value)}
          />
        ) : field.key === "requested_amount" ||
          field.key === "cofinance_amount" ? (
          <MoneyInput
            id={`money-${field.key}`}
            locale={locale}
            value={payload.concept[field.key]}
            invalid={moneyFeedback[field.key].invalid}
            describedBy={`field-message-${field.key}`}
            readOnly={application.stage === 2 && !!payload.budget?.lines.length}
            onFocus={() => setMoneyFocused(field.key as MoneyField)}
            onBlur={() => {
              setMoneyTouched((current) => ({
                ...current,
                [field.key]: true,
              }));
              setMoneyFocused(null);
            }}
            onValidity={(valid, text) => {
              setMoneyInputText((current) => ({
                ...current,
                [field.key]: text,
              }));
              setInvalidMoneyEntries((current) => ({
                ...current,
                [field.key]: !valid,
              }));
              if (valid)
                setError((current) =>
                  current === moneyActionError ? "" : current,
                );
            }}
            onChange={(value) => updateConcept(field.key, value)}
          />
        ) : (
          <input
            aria-required="true"
            aria-describedby={
              field.type === "date"
                ? "project-date-guidance"
                : financialHelp(field.key)
                  ? `field-message-${field.key}`
                  : financial[field.key]
                    ? `field-error-${field.key}`
                    : undefined
            }
            readOnly={
              application.stage === 2 &&
              !!payload.budget?.lines.length &&
              ["requested_amount", "cofinance_amount", "admin_cost"].includes(
                field.key,
              )
            }
            type={field.type || "text"}
            min={
              field.type === "number"
                ? 0
                : field.key === "end_date"
                  ? payload.concept.start_date || undefined
                  : undefined
            }
            max={
              field.key === "end_date"
                ? maxProjectEnd(
                    payload.concept.start_date,
                    selectedCategory?.max_months || 36,
                  )
                : field.key === "admin_cost"
                  ? adminLimit
                  : undefined
            }
            aria-invalid={
              isMoneyField(field.key)
                ? moneyFeedback[field.key].invalid
                : Boolean(financial[field.key]) || fieldIssue(field.key)
            }
            onFocus={() => {
              if (isMoneyField(field.key)) setMoneyFocused(field.key);
            }}
            onBlur={() => {
              if (isMoneyField(field.key)) {
                setMoneyTouched((t) => ({
                  ...t,
                  [field.key]: true,
                }));
                setMoneyFocused(null);
              }
            }}
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
          <small
            id={`field-message-${field.key}`}
            data-field-message={
              visibleFinancialError(field.key) ? "error" : undefined
            }
            className={
              visibleFinancialError(field.key) ? "field-warning" : undefined
            }
            role={visibleFinancialError(field.key) ? "alert" : undefined}
          >
            {financialHelp(field.key)}
          </small>
        )}
        {currentIssues.missing.includes(field.key) &&
          field.key !== "project_type" &&
          !isMoneyField(field.key) &&
          !financial[field.key] && (
            <small
              className="field-warning"
              data-field-message="error"
              id={`field-required-${field.key}`}
            >
              {es
                ? "Complete este campo obligatorio."
                : "Complete this required field."}
            </small>
          )}
        {!isMoneyField(field.key) &&
          field.type !== "date" &&
          financial[field.key] &&
          !financialHelp(field.key) && (
            <small
              className="field-warning"
              role="alert"
              data-field-message="error"
              id={`field-error-${field.key}`}
            >
              {field.key === "end_date" || field.key === "start_date"
                ? financial[field.key] === "CATEGORY_DURATION"
                  ? es
                    ? `La duración del proyecto supera el máximo de ${categoryMonthsEs} meses de la categoría de subvención seleccionada por usted. Corrija las fechas para continuar.`
                    : `The project duration exceeds the maximum of ${selectedCategory?.max_months} months for the grant category you selected. Correct the dates to continue.`
                  : es
                    ? "Ingrese fechas válidas. La finalización debe ser posterior al inicio del proyecto."
                    : "Enter valid dates. The project end must follow its start."
                : financial[field.key] === "CATEGORY_AMOUNT"
                  ? (es
                      ? "El monto solicitado no corresponde a la categoría seleccionada. "
                      : "The requested amount is outside the selected category. ") +
                    financialHelp(field.key)
                  : message(financial[field.key]!, es)}
            </small>
          )}
      </label>
    );
  const renderIdentity = (key: keyof Concept) => {
    const field = identityFieldsForStage(application.stage).find(
      (f) => f.key === key,
    );
    return field ? renderField(field) : null;
  };
  const initialTotal = payload.activities
    .flatMap((a) => a.risks)
    .reduce((sum, r) => sum + (riskScore(r.probability, r.severity) || 0), 0);
  return (
    <>
      <Link href="/applicant/applications" className="text-button">
        ← {es ? "Mis postulaciones" : "My applications"}
      </Link>
      <div className="live-title application-heading module-heading">
        <div>
          <p className="eyebrow">
            {application.reference_code} · {es ? "Fase" : "Phase"}{" "}
            {application.stage}
          </p>
          <h1 className="application-form-title">
            {application.stage === 1
              ? es
                ? "Nota conceptual del proyecto"
                : "Project concept note"
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
          <p>{es ? call.title_es : call.title_en}</p>
          <div className="application-status-grid">
            <DeadlineCountdown
              deadline={
                application.stage === 1
                  ? call.closes_at
                  : application.phase2_deadline
              }
              serverNow={serverNow}
              locale={locale}
              stage={application.stage}
            />
            <div className="application-save-heading">
              <span className="status-pill neutral">
                {statusLabel(application.status, locale, "applicant")}
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
        </div>
      </div>
      {!editable && (
        <div className="live-notice">
          <LockKeyhole size={20} />
          <p>
            {academicReadOnly
              ? es
                ? "Consulta académica: puede recorrer el formulario y descargar los documentos disponibles."
                : "Academic review: browse the form and download available documents."
              : es
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
              "Información general",
              application.stage === 1
                ? "Descripción del proyecto"
                : "Proyecto completo",
              "Examen Ambiental y Social inicial",
              "Revisar y enviar",
            ]
          : [
              "General information",
              application.stage === 1 ? "Project description" : "Full proposal",
              "Initial environmental and social screening",
              "Review and submit",
            ]
        ).map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={step === i ? "step" : undefined}
            disabled={busy}
            onClick={() => {
              if (!checkMoneyEntries()) return;
              if (!budgetUiValid) {
                setError(
                  es
                    ? "Revise los importes del presupuesto: use como máximo dos decimales."
                    : "Check budget amounts: use at most two decimals.",
                );
                return;
              }
              setStep(i);
              setError("");
            }}
          >
            {i + 1}. {label}
            {showCompletion && completion.some((x) => x.step === i) && (
              <span className="step-pending">
                {" "}
                · {completion.filter((x) => x.step === i).length}{" "}
                {es ? "pendientes" : "pending"}
              </span>
            )}
          </button>
        ))}
      </nav>
      {editable && (
        <section
          className="application-progress"
          aria-label={es ? "Avance de la postulación" : "Application progress"}
        >
          <div>
            <strong>
              {es ? "Avance de requisitos" : "Requirements completed"}
            </strong>
            <span>{progress.percent}%</span>
          </div>
          <progress
            value={progress.percent}
            max={100}
            aria-label={es ? "Porcentaje completado" : "Completion percentage"}
          />
          <small>
            {es
              ? "Incluye únicamente información, declaraciones y anexos aplicables a esta fase. Guardar no equivale a cumplir requisitos. Completar el 100% no envía la postulación ni implica su aprobación."
              : "Includes only information, declarations and attachments applicable to this phase. Saving does not establish completeness. Reaching 100% does not submit or approve the application."}
          </small>
        </section>
      )}
      <CompletionFeedback
        issues={completion.filter(
          (issue) =>
            issue.id !== moneyFocused &&
            !(identityFocused && issue.id === "identity_number"),
        )}
        step={step}
        focusIssue={focusIssue}
        locale={locale}
      />
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
      {editable && (step === 0 || autoError) && (
        <aside className="live-card draft-save-status">
          {step === 0 && (
            <p>
              {es ? (
                <>
                  Su avance se guarda automáticamente después de dejar de
                  escribir. Puede salir y postergar la consignación de los datos
                  de{" "}
                  {application.stage === 1
                    ? "su nota conceptual"
                    : "su proyecto completo"}
                  , y continuar después desde este o cualquier dispositivo,
                  accediendo desde la opción del menú:{" "}
                  <strong>Mis postulaciones</strong> →{" "}
                  <strong>Continuar borrador</strong>. Solo se enviará{" "}
                  {application.stage === 1
                    ? "la nota conceptual final"
                    : "el proyecto completo"}
                  , cuando pulse Enviar al GLF.
                </>
              ) : (
                <>
                  Your progress is saved automatically after you stop typing.
                  You can leave and postpone entering your{" "}
                  {application.stage === 1 ? "concept note" : "full proposal"}{" "}
                  information, then continue later from this or any other device
                  using the menu option: <strong>My applications</strong> →{" "}
                  <strong>Continue draft</strong>. Your{" "}
                  {application.stage === 1
                    ? "final concept note"
                    : "full proposal"}{" "}
                  will only be submitted when you select Submit to GLF.
                </>
              )}
            </p>
          )}
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
      {pendingPartner && (
        <aside className="live-notice" role="alert">
          <p>
            {es
              ? "Hay una eliminación de organización pendiente. Complétela antes de seguir editando."
              : "A partner organization deletion is pending. Complete it before continuing to edit."}
          </p>
          <button
            type="button"
            className="button danger"
            disabled={busy}
            aria-busy={busy && operation === "remove-partner"}
            onClick={() => {
              void removePartnerRow(pendingPartner).catch(() => {});
            }}
          >
            <ActionLabel
              busy={busy && operation === "remove-partner"}
              pendingLabel={es ? "Eliminando…" : "Deleting…"}
            >
              {es ? "Reintentar eliminación" : "Retry deletion"}
            </ActionLabel>
          </button>
        </aside>
      )}
      <fieldset
        disabled={!editable || busy || !!pendingPartner}
        className="live-fieldset application-entry-fields"
      >
        <div className="live-card">
          {step <= 1 && (
            <div className="live-form">
              {step === 0 && (
                <>
                  <h2>
                    {es
                      ? "Información general y financiamiento"
                      : "Project details and funding"}
                  </h2>
                  <p>
                    {es
                      ? "Guarde su borrador para retomarlo desde su cuenta. Complete todos los apartados aplicables antes de enviar."
                      : "Save your draft to resume it from your account. Complete all applicable sections before submitting."}
                  </p>
                </>
              )}
              {step === 0 && (
                <div className="live-grid applicant-category-fields">
                  <label>
                    <span className="field-label">
                      {es ? "Tipo de solicitante" : "Applicant type"}
                      <RequiredMark locale={locale} />
                    </span>
                    <select
                      aria-required="true"
                      data-validation-field="applicant_type"
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
                    <span className="field-label">
                      {es ? "Categoría de subvención" : "Grant category"}
                      <RequiredMark locale={locale} />
                    </span>
                    <GrantCategorySelect
                      applicantType={payload.concept.applicant_type}
                      value={payload.concept.category_id}
                      rules={rules}
                      locale={locale}
                      onChange={(value) => updateConcept("category_id", value)}
                    />
                  </label>
                </div>
              )}

              <div
                className={step === 0 ? "live-grid form-columns" : "live-form"}
              >
                {step === 0 ? (
                  <>
                    <div className="live-grid full-width applicant-project-heading">
                      {renderIdentity("applicant_name")}
                      {renderIdentity("project_type")}
                    </div>
                    {renderIdentity("title")}
                    <div
                      className={`applicant-identification-row ${payload.concept.applicant_type === "individual" ? "individual-identification-row" : ""}`}
                    >
                      {step === 0 &&
                        payload.concept.applicant_type === "individual" && (
                          <label
                            className="applicant-identification editor-field"
                            data-validation-field="identity_number"
                          >
                            <span>
                              {es
                                ? "Número de cédula de identidad"
                                : "Identity card number"}
                              <RequiredMark locale={locale} />
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              spellCheck={false}
                              aria-required="true"
                              aria-invalid={identityInvalid}
                              aria-describedby="identity-number-help"
                              maxLength={10}
                              pattern="[0-9]{10}"
                              placeholder={es ? "10 dígitos" : "10 digits"}
                              value={payload.concept.identity_number || ""}
                              onFocus={() => setIdentityFocused(true)}
                              onBlur={(event) => {
                                setIdentityFocused(false);
                                setIdentityTouched(
                                  Boolean(event.currentTarget.value.trim()),
                                );
                              }}
                              onChange={(e) =>
                                updateConcept("identity_number", e.target.value)
                              }
                            />
                            <small
                              id="identity-number-help"
                              className={
                                identityInvalid ? "field-warning" : undefined
                              }
                              role={identityInvalid ? "alert" : undefined}
                              data-field-message={
                                identityInvalid ? "error" : undefined
                              }
                            >
                              {es
                                ? identityInvalid
                                  ? "Ingrese los 10 dígitos de su cédula, sin espacios ni guiones."
                                  : "10 dígitos, sin espacios ni guiones."
                                : identityInvalid
                                  ? "Enter the 10 digits of your identity card number, without spaces or hyphens."
                                  : "10 digits, without spaces or hyphens."}
                            </small>
                          </label>
                        )}
                      {step === 0 &&
                        ["individual", "organization"].includes(
                          payload.concept.applicant_type,
                        ) && (
                          <label className="applicant-identification editor-field">
                            <span>
                              {payload.concept.applicant_type === "individual"
                                ? es
                                  ? "Número de credencial de residencia permanente"
                                  : "Permanent residence card number"
                                : es
                                  ? "RUC de la organización"
                                  : "Organization RUC"}
                              <RequiredMark locale={locale} />
                            </span>
                            <input
                              aria-required="true"
                              data-validation-field={
                                payload.concept.applicant_type === "individual"
                                  ? "residence_number"
                                  : "ruc"
                              }
                              maxLength={
                                payload.concept.applicant_type === "individual"
                                  ? 50
                                  : 13
                              }
                              inputMode={
                                payload.concept.applicant_type ===
                                "organization"
                                  ? "numeric"
                                  : "text"
                              }
                              value={
                                (payload.concept.applicant_type === "individual"
                                  ? payload.concept.residence_number
                                  : payload.concept.ruc) || ""
                              }
                              aria-invalid={
                                identification ===
                                  (payload.concept.applicant_type ===
                                  "individual"
                                    ? "residence_number"
                                    : "ruc") &&
                                (showCompletion ||
                                  checkedStep === step ||
                                  !!(payload.concept.applicant_type ===
                                  "individual"
                                    ? payload.concept.residence_number
                                    : payload.concept.ruc))
                              }
                              onChange={(e) =>
                                updateConcept(
                                  payload.concept.applicant_type ===
                                    "individual"
                                    ? "residence_number"
                                    : "ruc",
                                  e.target.value,
                                )
                              }
                            />
                            <small>
                              {payload.concept.applicant_type === "individual"
                                ? es
                                  ? "La credencial de residencia permanente que se presente debe estar vigente."
                                  : "The permanent residence card presented must be current."
                                : es
                                  ? "La organización debe tener domicilio tributario en la provincia de Galápagos. Si no cumple este requisito, su postulación podría ser descalificada."
                                  : "The organization must have its tax domicile in Galápagos province. Failure to meet this requirement could disqualify the application."}
                            </small>
                            {identification ===
                              (payload.concept.applicant_type === "individual"
                                ? "residence_number"
                                : "ruc") &&
                              (showCompletion ||
                                checkedStep === step ||
                                !!(payload.concept.applicant_type ===
                                "individual"
                                  ? payload.concept.residence_number
                                  : payload.concept.ruc)) && (
                                <span className="error" role="alert">
                                  {payload.concept.applicant_type ===
                                  "individual"
                                    ? es
                                      ? "Ingrese el número de credencial de residencia permanente."
                                      : "Enter the permanent residence card number."
                                    : es
                                      ? "Ingrese un RUC de 13 dígitos."
                                      : "Enter a 13-digit RUC."}
                                </span>
                              )}
                          </label>
                        )}
                    </div>
                    {renderIdentity("contact_name")}
                    {renderIdentity("address")}
                    {renderIdentity("partners")}
                    {renderIdentity("location")}
                    <section
                      className="activity-card full-width project-duration-card"
                      aria-labelledby="project-duration-heading"
                    >
                      <h3
                        className="section-card-title"
                        id="project-duration-heading"
                      >
                        {proposalTitle("duration", locale)}
                      </h3>
                      <ProposalFieldGuidance field="duration" locale={locale} />
                      <div className="live-grid project-date-grid">
                        {renderIdentity("start_date")}
                        {renderIdentity("end_date")}
                      </div>
                      <div className="project-duration-footer">
                        <small
                          id="project-date-guidance"
                          className={dateError ? "field-warning" : "field-help"}
                          data-field-message={dateError ? "error" : undefined}
                          role={dateError ? "alert" : undefined}
                        >
                          {dateError === "CATEGORY_DURATION"
                            ? es
                              ? `La duración del proyecto supera el máximo de ${categoryMonthsEs} meses de la categoría de subvención seleccionada por usted. Corrija las fechas para continuar.`
                              : `The project duration exceeds the maximum of ${selectedCategory?.max_months} months for the grant category you selected. Correct the dates to continue.`
                            : dateError
                              ? es
                                ? "Ingrese fechas válidas. La finalización debe ser posterior al inicio del proyecto."
                                : "Enter valid dates. The project end must follow its start."
                              : selectedCategory
                                ? es
                                  ? `Plazo máximo permitido: ${selectedCategory.max_months} meses, según la categoría de subvención seleccionada.`
                                  : `Maximum allowed duration: ${selectedCategory.max_months} months for the selected grant category.`
                                : es
                                  ? "Seleccione una categoría para consultar el plazo máximo permitido."
                                  : "Select a category to see the maximum allowed duration."}
                        </small>
                        {durationText && (
                          <output
                            className="project-duration-value"
                            aria-live="polite"
                          >
                            {es ? "Duración: " : "Duration: "}
                            {durationText}
                          </output>
                        )}
                      </div>
                    </section>
                    <section
                      className="activity-card full-width funding-summary-card"
                      aria-labelledby="funding-summary-heading"
                    >
                      <h3
                        className="section-card-title"
                        id="funding-summary-heading"
                      >
                        {es
                          ? "Presupuesto total solicitado"
                          : "Total requested budget"}
                      </h3>
                      <div className="funding-summary-grid">
                        <div className="funding-summary-inputs">
                          {renderIdentity("requested_amount")}
                          {renderIdentity("cofinance_amount")}
                        </div>
                        <div
                          className="activity-card estimated-total-card"
                          aria-live="polite"
                        >
                          <span>
                            {es
                              ? "Costo total estimado"
                              : "Estimated total cost"}
                          </span>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "1.8rem",
                              marginTop: "0.3rem",
                            }}
                          >
                            {moneyUiValid
                              ? currency(totalCost)
                              : es
                                ? "Revise los importes"
                                : "Check amounts"}
                          </strong>
                          <small>
                            {es
                              ? "Monto solicitado al GLF + cofinanciamiento"
                              : "GLF requested amount + cofinancing"}
                          </small>
                        </div>
                      </div>
                      {renderIdentity("admin_cost")}
                    </section>
                  </>
                ) : (
                  fields.map(renderField)
                )}
              </div>
              {step === 0 && application.stage === 2 && (
                <BudgetFields
                  value={payload.budget}
                  years={budgetYears(
                    payload.concept.start_date,
                    payload.concept.end_date,
                  )}
                  locale={locale}
                  onValidity={setBudgetUiValid}
                  onChange={(b) =>
                    setPayload((p) => {
                      const budget = {
                        ...b,
                        legacy_summary: b.legacy_summary ?? {
                          requested_amount: p.concept.requested_amount,
                          cofinance_amount: p.concept.cofinance_amount,
                          admin_cost: p.concept.admin_cost,
                        },
                      };
                      const t = budgetTotals(budget);
                      return {
                        ...p,
                        budget,
                        concept: b.lines.length
                          ? {
                              ...p.concept,
                              requested_amount: t.glf / 100,
                              cofinance_amount: t.other / 100,
                              admin_cost: (t.admin.glf + t.admin.other) / 100,
                            }
                          : p.concept,
                      };
                    })
                  }
                />
              )}
              {step === 1 && (
                <ActivityPlanningFields
                  payload={payload}
                  locale={locale}
                  checked={checkedStep === 1}
                  onChange={(activities) =>
                    setPayload((p) => ({ ...p, activities }))
                  }
                />
              )}
              {step === 1 && (
                <MonitoringFields
                  payload={payload}
                  locale={locale}
                  checked={checkedStep === 1}
                  onChange={(concept) => setPayload((p) => ({ ...p, concept }))}
                />
              )}
              {step === 1 && application.stage === 2 && (
                <section>
                  <h2>
                    {es
                      ? "Proyecto completo: campos oficiales de la convocatoria"
                      : "Full proposal: official call fields"}
                  </h2>
                  <p>
                    {es
                      ? "PGAS: Plan de Gestión Ambiental y Social. PPPI: Plan de Participación de las Partes Interesadas. MGQ: Mecanismo de Gestión de Quejas. Complete los instrumentos requeridos por GLF en esta convocatoria."
                      : "ESMP: Environmental and Social Management Plan. SEP: Stakeholder Engagement Plan. GRM: Grievance Redress Mechanism. Complete the instruments required by GLF for this call."}
                  </p>
                  {call.phase2_schema.map((f) => (
                    <label key={f.id} data-validation-field={"phase2:" + f.id}>
                      <span className="field-label">
                        {es ? f.label_es : f.label_en}
                        {f.required ? (
                          <RequiredMark locale={locale} />
                        ) : (
                          <small> ({es ? "Opcional" : "Optional"})</small>
                        )}
                      </span>
                      <LimitedTextarea
                        locale={locale}
                        aria-required={f.required}
                        placeholder={
                          es
                            ? "Escriba aquí su respuesta."
                            : "Write your response here."
                        }
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
              <RiskOverview payload={payload} locale={locale} />
              {application.stage === 2 && (
                <RiskReferenceTable
                  payload={payload}
                  locale={locale}
                  references={[
                    ...new Set(
                      catalog.map((c) => c.normative_reference).filter(Boolean),
                    ),
                  ]}
                  onChange={(ai, ri, performance_standard) =>
                    updateRisk(ai, ri, { performance_standard })
                  }
                />
              )}
              {payload.activities.map((activity, ai) => (
                <section
                  className="activity-card"
                  key={activity.id}
                  data-validation-activity={ai + 1}
                >
                  <h3>
                    {es ? "Actividad" : "Activity"} {ai + 1}:{" "}
                    {activity.title.trim() || (es ? "Sin nombre" : "Unnamed")}
                  </h3>
                  <p className="screening-activity-description">
                    {activity.description}
                  </p>
                  {payload.concept.strategic_alignment?.objectives
                    .filter((o) => o.kind === "specific")
                    .map((o, i) =>
                      activity.objective_ids?.includes(o.id) ? (
                        <p
                          className="screening-activity-description"
                          key={o.id}
                        >
                          <strong>
                            {es ? "Objetivo específico" : "Specific objective"}{" "}
                            {i + 1}:
                          </strong>{" "}
                          {o.text}
                        </p>
                      ) : null,
                    )}
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                  >
                    {es
                      ? "Editar actividad y objetivos en Descripción del proyecto"
                      : "Edit activity and objectives in project description"}
                  </button>
                  {activity.risks.length === 0 && (
                    <label>
                      <span className="field-label">
                        {es
                          ? "Justificación si no identifica riesgos"
                          : "Explanation if no risks are identified"}
                        <RequiredMark locale={locale} />
                      </span>
                      <LimitedTextarea
                        locale={locale}
                        aria-required="true"
                        value={activity.no_risks_reason}
                        placeholder={
                          es
                            ? "Explique por qué no identifica riesgos en esta actividad."
                            : "Explain why no risks are identified for this activity."
                        }
                        maxLength={12000}
                        onChange={(e) =>
                          updateActivity(ai, {
                            no_risks_reason: e.target.value,
                          })
                        }
                      />
                    </label>
                  )}
                  {activity.risks.map((risk, ri) => {
                    const score = riskScore(risk.probability, risk.severity);
                    const residual = riskScore(
                      risk.residual_probability,
                      risk.residual_severity,
                    );
                    return (
                      <article
                        className="live-risk"
                        key={risk.id}
                        data-validation-risk={`${ai + 1}-${ri + 1}`}
                      >
                        <div className="live-title">
                          <h4>
                            <ShieldCheck size={17} /> {es ? "Riesgo" : "Risk"}{" "}
                            {ai + 1}.{ri + 1}
                            {risk.source_id && (
                              <>
                                {" "}
                                ·{" "}
                                {riskLabel(
                                  payload.concept.risk_register || [],
                                  risk.source_id,
                                  locale,
                                )}
                              </>
                            )}
                          </h4>
                          <ConfirmRemoveButton
                            locale={locale}
                            element={`${es ? "Evaluación de riesgo" : "Risk assessment"} ${ai + 1}.${ri + 1}: ${risk.name || "—"} · ${activity.title}`}
                            consequence={
                              es
                                ? "Se eliminarán la evaluación de este riesgo en esta actividad, sus calificaciones y sus medidas. Se conservarán la actividad, el riesgo potencial registrado y las evaluaciones en otras actividades."
                                : "This activity's risk assessment, scores and measures will be removed. The activity, registered potential risk and assessments in other activities will be kept."
                            }
                            onConfirm={() =>
                              updateActivity(ai, {
                                risks: activity.risks.filter(
                                  (_, i) => i !== ri,
                                ),
                              })
                            }
                            aria-label={`${es ? "Quitar evaluación de riesgo" : "Remove risk assessment"} ${ri + 1} · ${activity.title}`}
                          />
                        </div>
                        <div className="live-grid form-columns">
                          {payload.concept.risk_register && (
                            <label className="full-width">
                              <span className="field-label">
                                {es
                                  ? "Seleccione un riesgo registrado"
                                  : "Select a registered risk"}
                                <RequiredMark locale={locale} />
                              </span>
                              <select
                                data-validation-field="source_id"
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
                                      {riskLabel(
                                        payload.concept.risk_register!,
                                        r.id,
                                        locale,
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
                            <span className="field-label">
                              {es ? "Dimensión" : "Dimension"}
                              <RequiredMark locale={locale} />
                            </span>
                            <select
                              data-validation-field="dimension"
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
                            <span className="field-label">
                              {es ? "Riesgo o impacto" : "Risk or impact"}
                              <RequiredMark locale={locale} />
                            </span>
                            <input
                              data-validation-field="name"
                              aria-required="true"
                              value={risk.name}
                              readOnly={Boolean(payload.concept.risk_register)}
                              onChange={(e) =>
                                updateRisk(ai, ri, { name: e.target.value })
                              }
                            />
                          </label>
                          <label className="full-width">
                            <span className="field-label">
                              {es
                                ? "Descripción concisa del riesgo"
                                : "Concise risk description"}
                              <RequiredMark locale={locale} />
                            </span>
                            <LimitedTextarea
                              locale={locale}
                              data-validation-field="description"
                              placeholder={
                                es
                                  ? "Describa el riesgo y cómo podría ocurrir."
                                  : "Describe the risk and how it could occur."
                              }
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
                              ? "Probabilidad de ocurrencia (1–5)"
                              : "Probability of occurrence (1–5)",
                            risk.probability,
                            (n) => updateRisk(ai, ri, { probability: n }),
                          )}
                          {scale(
                            es
                              ? "Gravedad del riesgo (1–5)"
                              : "Risk severity (1–5)",
                            risk.severity,
                            (n) => updateRisk(ai, ri, { severity: n }),
                          )}
                        </div>
                        <div className={"risk-result " + riskLevel(score)}>
                          {es ? "Puntaje del riesgo" : "Risk score"}:{" "}
                          <strong>
                            {risk.probability ?? "—"} × {risk.severity ?? "—"} ={" "}
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
                                      <span className="field-label">
                                        {es
                                          ? "Medida propuesta"
                                          : "Proposed measure"}
                                        <RequiredMark locale={locale} />
                                      </span>
                                      <LimitedTextarea
                                        locale={locale}
                                        aria-required="true"
                                        placeholder={
                                          es
                                            ? "Describa la medida que propone para gestionar este riesgo."
                                            : "Describe the proposed measure to manage this risk."
                                        }
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
                                  <ConfirmRemoveButton
                                    locale={locale}
                                    element={`${es ? "Medida" : "Measure"} ${mi + 1}: ${m.catalog_id ? catalog.find((c) => c.id === m.catalog_id)?.[es ? "label_es" : "label_en"] || m.catalog_id : m.text || "—"} · ${risk.name}`}
                                    aria-label={`${es ? "Quitar medida" : "Remove measure"} ${mi + 1} · ${risk.name}`}
                                    onConfirm={() =>
                                      updateRisk(ai, ri, {
                                        measures: risk.measures.filter(
                                          (_, i) => i !== mi,
                                        ),
                                      })
                                    }
                                  />
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
                                <span className="field-label">
                                  {es ? "Ubicación" : "Location"}
                                  <RequiredMark locale={locale} />
                                </span>
                                <input
                                  data-validation-field="location"
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
                                <span className="field-label">
                                  {es
                                    ? "Costo estimado (USD)"
                                    : "Estimated cost (USD)"}
                                  <RequiredMark locale={locale} />
                                </span>
                                <input
                                  data-validation-field="cost"
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
                                <span className="field-label">
                                  {es
                                    ? "Responsable de la medida"
                                    : "Person responsible for the measure"}
                                  <RequiredMark locale={locale} />
                                </span>
                                <input
                                  data-validation-field="responsible"
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
                className="button secondary"
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
              >
                {es
                  ? "Editar o agregar actividades en Descripción del proyecto"
                  : "Edit or add activities in project description"}
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
              <ConceptReview
                concept={payload.concept}
                activities={payload.activities}
                includeActivities
                locale={locale}
                rules={rules}
                presentation={{
                  stage: application.stage,
                  layoutVersion:
                    editable || !versions.length
                      ? currentConceptLayout
                      : (versions[0].concept_layout_version ?? null),
                }}
              />
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
                {privacyNotice(
                  es ? rules.privacy_es : rules.privacy_en,
                  locale,
                )}
              </p>
              <label className="check-row">
                <input
                  type="checkbox"
                  data-validation-field="truthful"
                  checked={payload.truthful}
                  aria-required="true"
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, truthful: e.target.checked }))
                  }
                />
                <span className="field-label">
                  {es
                    ? "Confirmo que la información refleja la propuesta que presento."
                    : "I confirm that this information reflects the proposal I am submitting."}
                  <RequiredMark locale={locale} />
                </span>
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  data-validation-field="consent"
                  checked={payload.consent}
                  aria-required="true"
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, consent: e.target.checked }))
                  }
                />
                <span className="field-label">
                  {es
                    ? "He leído y acepto el aviso de privacidad de esta convocatoria."
                    : "I have read and accept this call's privacy notice."}
                  <RequiredMark locale={locale} />
                </span>
              </label>
            </div>
          )}
        </div>
      </fieldset>
      {step === 3 && editable && (
        <section className="live-card">
          <h2>
            {application.stage === 1
              ? es
                ? "Preparar, firmar y adjuntar"
                : "Prepare, sign and attach"
              : es
                ? "Documentos del proyecto completo"
                : "Full proposal documents"}
          </h2>
          <p>
            {application.stage === 1
              ? es
                ? "Guarde todos los campos y declaraciones. Prepare los documentos, descargue la Nota Conceptual y la evaluación A&S por separado, firme electrónicamente ambos documentos fuera del portal y adjunte cada PDF firmado. Si modifica el formulario, deberá preparar y firmar nuevamente. La validez de la firma será revisada por GLF."
                : "Save all fields and declarations. Prepare and download the Concept Note and E&S screening separately, sign both documents electronically outside this portal and attach each signed PDF. After editing, prepare and sign again. GLF will review signature validity."
              : es
                ? "Revise la información de la nota conceptual y complete los apartados del proyecto y su plan de gestión ambiental y social. Guarde los cambios para preparar y descargar la propuesta completa y la evaluación A&S. Adjunte los documentos exigidos por la convocatoria antes de enviar al GLF."
                : "Review the concept note information and complete the full proposal sections and environmental and social management plan. Save your changes to prepare and download the full proposal and E&S assessment. Attach the documents required by the call before submitting to GLF."}
          </p>
          {showCompletion && completion.length > 0 && (
            <div className="completion-summary" role="alert" tabIndex={-1}>
              <h3>
                {es
                  ? `Hay ${completion.length} pendientes antes de preparar o enviar los documentos`
                  : `${completion.length} items need attention before preparing or submitting documents`}
              </h3>
              <p>
                {es
                  ? "Seleccione un pendiente para ir al campo que necesita revisar."
                  : "Select an item to go to the field that needs attention."}
              </p>
              <ul>
                {completion.map((issue) => (
                  <li key={issue.id}>
                    <button
                      type="button"
                      className="completion-link"
                      onClick={() => goToIssue(issue)}
                    >
                      {
                        [
                          es ? "Información general" : "General information",
                          es
                            ? "Descripción del proyecto"
                            : "Project description",
                          es ? "Actividades y riesgos" : "Activities and risks",
                          es ? "Declaraciones" : "Declarations",
                        ][issue.step]
                      }{" "}
                      → {issue.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {prepared && (prepared.revision !== revision || dirty) && (
            <p className="document-stale" role="status">
              {es
                ? "Los documentos requieren actualización. Prepare y firme nuevamente después de guardar los cambios."
                : "Documents need updating. Prepare and sign again after saving your changes."}
            </p>
          )}
          <div className="document-actions">
            <button
              className="button dark"
              disabled={busy || dirty || !budgetUiValid || !moneyUiValid}
              aria-busy={busy && operation === "prepare"}
              onClick={async () => {
                if (busy) return;
                setShowCompletion(true);
                setCompletionAttempt((n) => n + 1);
                if (
                  completionGuidance(
                    payload,
                    rules,
                    application.stage,
                    call.phase2_schema,
                    locale,
                  ).length
                )
                  return;
                setOperation("prepare");
                setBusy(true);
                setError("");
                try {
                  const result = await prepareDocuments(
                    application.id,
                    revision,
                  );
                  if (result.id && result.created_at)
                    setPrepared({
                      id: result.id,
                      revision,
                      created_at: result.created_at,
                    });
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
                pendingLabel={es ? "Procesando…" : "Processing…"}
              >
                {application.stage === 1
                  ? es
                    ? "Preparar documentos para firma"
                    : "Prepare documents for signing"
                  : es
                    ? "Preparar documentos"
                    : "Prepare documents"}
              </ActionLabel>
            </button>
            {prepared && prepared.revision === revision && !dirty && (
              <>
                <DocumentDownload
                  href={`/documents/${prepared.id}/concept?prepared=1&lang=${locale}`}
                  locale={locale}
                >
                  {application.stage === 1
                    ? es
                      ? "Descargar nota conceptual"
                      : "Download concept note"
                    : es
                      ? "Descargar propuesta completa"
                      : "Download full proposal"}
                </DocumentDownload>
                <DocumentDownload
                  href={`/documents/${prepared.id}/matrix?prepared=1&lang=${locale}`}
                  locale={locale}
                >
                  {es ? "Descargar evaluación A&S" : "Download E&S screening"}
                </DocumentDownload>
              </>
            )}
          </div>
        </section>
      )}
      {step === 3 && application.stage === 1 && (
        <section className="live-card">
          <h2>{es ? "Documentos firmados" : "Signed documents"}</h2>
          <p className="field-help">
            {!editable
              ? es
                ? "Documentos adjuntos a su expediente."
                : "Documents attached to your application."
              : es
                ? "Descargue los documentos preparados por el sistema, fírmelos electrónicamente y cargue aquí cada PDF firmado. Si modifica el formulario, deberá preparar, firmar y cargar nuevamente ambos documentos."
                : "Download the documents prepared by the system, sign them electronically and upload each signed PDF here. If you edit the form, prepare, sign and upload both documents again."}
          </p>
          {[
            [
              "concept_signed",
              es
                ? "Nota conceptual firmada electrónicamente"
                : "Electronically signed concept note",
            ],
            [
              "matrix_signed",
              es
                ? "Evaluación de riesgos ambientales y sociales firmada electrónicamente"
                : "Electronically signed environmental and social risk assessment",
            ],
          ].map(([kind, title]) => {
            const doc = documents.find((d) => d.kind === kind);
            return (
              <SignedDocumentUpload
                key={kind}
                kind={kind}
                title={title}
                locale={locale}
                document={doc}
                current={Boolean(
                  doc &&
                  prepared &&
                  prepared.revision === revision &&
                  !dirty &&
                  Date.parse(doc.created_at) >= Date.parse(prepared.created_at),
                )}
                editable={editable}
                ready={Boolean(
                  prepared && prepared.revision === revision && !dirty,
                )}
                busy={busy}
                onUpload={uploadForm}
              />
            );
          })}
          <RequiredAttachmentUploads
            rules={rules}
            concept={payload.concept}
            ready={!dirty && !autoSaving}
            uploadError={operation === "upload" ? error : ""}
            stage={application.stage}
            locale={locale}
            documents={documents}
            busy={busy || !editable}
            onUpload={uploadForm}
          />
        </section>
      )}
      {step === 3 && application.stage !== 1 && (
        <section className="live-card">
          <h2>{es ? "Anexos del proyecto" : "Project attachments"}</h2>
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
              ...applicationAttachments(rules, payload.concept).map((r) =>
                es ? r.label_es : r.label_en,
              ),
            ].join(", ") || (es ? "Ninguno adicional" : "None additional")}
          </p>
          <RequiredAttachmentUploads
            rules={rules}
            concept={payload.concept}
            ready={!dirty && !autoSaving}
            uploadError={operation === "upload" ? error : ""}
            stage={application.stage}
            locale={locale}
            documents={documents}
            busy={busy || !editable}
            onUpload={uploadForm}
          />
          {documents
            .filter(
              (d) =>
                !applicationAttachments(rules, payload.concept).some(
                  (r) => r.id === d.kind,
                ) && !isPartnerLetterDocument(rules, d.kind),
            )
            .map((d) => (
              <div className="document-row" key={d.id}>
                <span>
                  {d.file_name} · {d.kind}
                </span>
                <DocumentDownload href={"/files/" + d.id} locale={locale}>
                  {es ? "Descargar" : "Download"}
                </DocumentDownload>
              </div>
            ))}
          {editable && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void uploadForm(event.currentTarget);
              }}
              className="live-form"
            >
              <label>
                <span className="field-label">
                  {es ? "Tipo de anexo" : "Attachment type"}
                  <RequiredMark locale={locale} />
                </span>
                <select name="kind">
                  {[...new Set(["concept_signed", "other"])].map((k) => (
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
                <span className="field-label">
                  {es ? "Archivo (máximo 4 MB)" : "File (maximum 4 MB)"}
                  <RequiredMark locale={locale} />
                </span>
                <FileDropField
                  locale={locale}
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
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
            {step === 3 && !!missingLetters.length && (
              <p className="field-warning" role="status">
                {es
                  ? "Cartas de apoyo pendientes: "
                  : "Pending letters of support: "}
                {missingLetters
                  .map((r) => (es ? r.label_es : r.label_en))
                  .join("; ")}
              </p>
            )}
            {step === 3 && application.stage === 1 && !signedDocumentsReady && (
              <p className="field-help" role="status">
                {es
                  ? "Para enviar al GLF, cargue ambos PDF firmados de la versión vigente."
                  : "Upload both signed PDFs for the current version before submitting to GLF."}
              </p>
            )}
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
                  disabled={
                    busy ||
                    !!missingLetters.length ||
                    !signedDocumentsReady ||
                    !budgetUiValid ||
                    !moneyUiValid
                  }
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
                    if (!checkMoneyEntries()) return;
                    if (!budgetUiValid) {
                      setError(
                        es
                          ? "Revise los importes del presupuesto: use como máximo dos decimales."
                          : "Check budget amounts: use at most two decimals.",
                      );
                      return;
                    }
                    setCheckedStep(step);
                    const issues = stepIssues(
                      payload,
                      rules,
                      application.stage,
                      step,
                      call.phase2_schema,
                    );
                    if (issues.missing.length || issues.invalid.length) {
                      setShowCompletion(true);
                      const firstIssue = completionGuidance(
                        payload,
                        rules,
                        application.stage,
                        call.phase2_schema,
                        locale,
                      ).find((issue) => issue.step === step);
                      if (firstIssue) setFocusIssue({ ...firstIssue });
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
                    setStep(Math.min(step + 1, 3));
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
          {versions.map((v) => (
            <div className="document-row submission-history-row" key={v.id}>
              <div>
                <p>
                  {submissionConfirmation(
                    v.stage,
                    v.project_title,
                    v.submitted_at,
                    locale,
                  )}
                </p>
                <span>
                  {es ? "Versión" : "Version"} {v.revision} ·{" "}
                  {submissionPhase(v.stage, locale)}
                </span>
              </div>
              <div className="live-actions">
                <ReceiptDownload id={v.id} locale={locale} />
                <DocumentDownload
                  className="button secondary"
                  href={"/documents/" + v.id + "/concept"}
                  locale={locale}
                >
                  {v.stage === 1
                    ? es
                      ? "Nota conceptual"
                      : "Concept note"
                    : es
                      ? "Propuesta completa"
                      : "Full proposal"}
                </DocumentDownload>
                <DocumentDownload
                  className="button secondary"
                  href={"/documents/" + v.id + "/matrix"}
                  locale={locale}
                >
                  {es
                    ? "Evaluación de riesgos ambientales y sociales"
                    : "Environmental and social risk assessment"}
                </DocumentDownload>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
