"use client";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  emptySgasExperience,
  sgasGroups,
  sgasQuestions,
  sgasIssues,
  sgasIssueMessage,
  type SgasExperience,
  type SgasDocument,
  type SgasSource,
  sgasPresentation,
} from "@/lib/sgas-experience";
import { LimitedTextarea } from "./limited-textarea";
import { DocumentDownload } from "./document-download";

export function SgasExperienceFields({
  value,
  individual,
  locale,
  onChange,
  checked,
  document,
  hasPrevious,
  onViewAttachments,
}: {
  value?: SgasExperience;
  individual: boolean;
  locale: "es" | "en";
  onChange: (value: SgasExperience) => void;
  checked: boolean;
  document?: SgasDocument;
  hasPrevious: boolean;
  onViewAttachments: () => void;
}) {
  const es = locale === "es",
    form = value ?? emptySgasExperience(),
    issues = checked ? sgasIssues(form) : [];
  const questions = sgasQuestions(individual, es);
  function detail(
    key: "investigation_status" | "standards_detail" | "assessments_detail",
    label: string,
    required = false,
  ) {
    const invalid = issues.includes("sgas_" + key);
    return (
      <div className="sgas-detail" data-validation-sgas={key}>
        <label htmlFor={"sgas-" + key}>
          {label}
          {required && <span className="required-mark"> *</span>}
        </label>
        <LimitedTextarea
          id={"sgas-" + key}
          locale={locale}
          value={form[key]}
          rows={3}
          maxLength={key === "investigation_status" ? 4000 : 2000}
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={invalid ? "sgas-error-" + key : undefined}
          placeholder={
            es
              ? "Escriba aquí la información solicitada"
              : "Enter the requested information here"
          }
          onChange={(e) => onChange({ ...form, [key]: e.target.value })}
        />
        {invalid && (
          <small id={"sgas-error-" + key} className="field-error" role="alert">
            {sgasIssueMessage("sgas_" + key, locale)}
          </small>
        )}
      </div>
    );
  }
  return (
    <section
      className="sgas-fields"
      id="sgas-experience"
      data-validation-field="sgas_experience"
    >
      <h2 className="application-section-title">
        {es ? "Experiencia SGAS" : "ESMS experience"}
      </h2>
      <p className="field-help">
        {es
          ? "Responda sobre su experiencia y capacidad para aplicar el Sistema de Gestión Ambiental y Social. Puede guardar un borrador incompleto. Al concluir, pulse Finalizar y anexar: el sistema incorporará el PDF a Revisar y enviar → Anexos."
          : "Answer about your experience and capacity to apply the Environmental and Social Management System. You can save an incomplete draft. When finished, select Complete and attach: the PDF will be added to Review and submit → Attachments."}
      </p>
      <p className="sgas-reference-links">
        <a
          href={
            es
              ? "https://galapagoslifefund.org.ec/es/data_resources/sistema-de-gestion-de-riesgos-ambientales-y-sociales/"
              : "https://www.galapagoslifefund.org.ec/wp-content/uploads/2025/02/1_GLF-ESMS-Manual_Web_SA-Oct-2024.pdf"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {es
            ? "Consultar Manual SGAS y procedimientos del GLF ↗"
            : "View GLF ESMS manual and procedures ↗"}
        </a>
        <a href="/exclusions" target="_blank" rel="noopener noreferrer">
          {es ? "Consultar Lista de Exclusión ↗" : "View Exclusion List ↗"}
        </a>
      </p>
      {sgasGroups.map((group, index) => (
        <section className="sgas-group" key={index}>
          <h3>{group[es ? 0 : 1]}</h3>
          {questions
            .filter(
              (q) =>
                q.group === index &&
                (q.key !== "external_expertise" ||
                  form.external_staff === true),
            )
            .map((q) => {
              const invalid = issues.includes("sgas_" + q.key);
              return (
                <div
                  className="sgas-question"
                  key={q.key}
                  data-validation-sgas={q.key}
                >
                  <fieldset
                    className="sgas-answer"
                    role="radiogroup"
                    aria-required="true"
                    aria-invalid={invalid}
                    aria-labelledby={"sgas-question-" + q.key}
                    aria-describedby={q.help ? "sgas-help-" + q.key : undefined}
                  >
                    <legend className="sr-only" id={"sgas-question-" + q.key}>
                      {q.text}
                    </legend>
                    <div className="sgas-answer-row">
                      <p aria-hidden="true">
                        {q.number && <strong>{q.number}. </strong>}
                        {q.text}
                        <span className="required-mark"> *</span>
                      </p>
                      <div className="sgas-options">
                        {[true, false].map((answer) => (
                          <label key={String(answer)}>
                            <input
                              type="radio"
                              name={"sgas-" + q.key}
                              value={String(answer)}
                              checked={form[q.key] === answer}
                              aria-describedby={
                                invalid ? "sgas-error-" + q.key : undefined
                              }
                              onChange={() =>
                                onChange({ ...form, [q.key]: answer })
                              }
                            />
                            {answer ? (es ? "Sí" : "Yes") : "No"}
                          </label>
                        ))}
                      </div>
                    </div>
                  </fieldset>
                  {q.help && (
                    <small id={"sgas-help-" + q.key} className="field-help">
                      {q.help}
                    </small>
                  )}
                  {invalid && (
                    <small
                      id={"sgas-error-" + q.key}
                      className="field-error"
                      role="alert"
                    >
                      {es ? "Seleccione Sí o No." : "Select Yes or No."}
                    </small>
                  )}
                  {q.key === "human_rights_involved" &&
                    form.human_rights_involved &&
                    detail(
                      "investigation_status",
                      es
                        ? "Indique el estado de cualquier investigación"
                        : "State the status of any investigation",
                      true,
                    )}
                  {q.key === "international_standards" &&
                    form.international_standards &&
                    detail(
                      "standards_detail",
                      es
                        ? "Normas aplicadas y experiencia breve (opcional)"
                        : "Standards applied and brief experience (optional)",
                    )}
                  {q.key === "environmental_assessments" &&
                    form.environmental_assessments &&
                    detail(
                      "assessments_detail",
                      es
                        ? "Evaluaciones y herramientas desarrolladas (opcional)"
                        : "Assessments and tools developed (optional)",
                    )}
                </div>
              );
            })}
        </section>
      ))}
      {document ? (
        <div
          className="sgas-success"
          role="status"
          id="sgas-completion"
          tabIndex={-1}
        >
          <CheckCircle2 size={22} aria-hidden="true" />
          <div>
            <strong>
              {es
                ? "Formulario completado y anexado"
                : "Form completed and attached"}
            </strong>
            <p>
              {es
                ? "Sus respuestas al formulario Experiencia SGAS se han guardado y el documento se ha anexado automáticamente a los documentos de su propuesta. Puede consultarlo en Revisar y enviar → Anexos."
                : "Your ESMS experience answers have been saved and the document has been automatically attached to your proposal documents. View it in Review and submit → Attachments."}
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={onViewAttachments}
            >
              {es ? "Ver en Anexos" : "View in Attachments"}
            </button>
          </div>
        </div>
      ) : hasPrevious ? (
        <div className="sgas-pending" role="status">
          <AlertCircle size={22} aria-hidden="true" />
          <p>
            {es
              ? "Anexo pendiente de actualización. Ha modificado las respuestas o los datos del encabezado. Pulse Actualizar anexo al concluir."
              : "Attachment needs updating. Answers or heading details have changed. Select Update attachment when finished."}
          </p>
        </div>
      ) : null}
    </section>
  );
}

export function GeneratedSgasAttachment({
  document,
  hasPrevious,
  locale,
  onEdit,
  editable,
}: {
  document?: SgasDocument;
  hasPrevious: boolean;
  locale: "es" | "en";
  onEdit?: () => void;
  editable: boolean;
}) {
  const es = locale === "es";
  return (
    <div className="sgas-attachment" id="sgas-attachment">
      <h3>{es ? "Experiencia SGAS" : "ESMS experience"}</h3>
      {document ? (
        <>
          <p className="sgas-success-text">
            <CheckCircle2 size={18} aria-hidden="true" />
            {es
              ? "PDF anexado automáticamente · No requiere firma ni carga manual."
              : "PDF automatically attached · No signature or manual upload required."}
          </p>
          <p>{document.file_name}</p>
          <DocumentDownload
            href={"/files/" + document.id}
            locale={locale}
            fileName={document.file_name}
          >
            {es ? "Consultar Experiencia SGAS" : "View ESMS experience"}
          </DocumentDownload>
        </>
      ) : (
        <p role="status">
          {hasPrevious
            ? es
              ? "Anexo pendiente de actualización."
              : "Attachment needs updating."
            : es
              ? "Pendiente: complete el paso Experiencia SGAS y pulse Finalizar y anexar."
              : "Pending: complete ESMS experience and select Complete and attach."}
        </p>
      )}
      {!document && editable && onEdit && (
        <button className="button secondary" type="button" onClick={onEdit}>
          {es ? "Ir a Experiencia SGAS" : "Go to ESMS experience"}
        </button>
      )}
    </div>
  );
}
export function SgasReview({
  source,
  locale,
}: {
  source: SgasSource;
  locale: "es" | "en";
}) {
  if (!source.questionnaire) return null;
  return (
    <section className="concept-review-section">
      <h3 className="application-section-title">
        {locale === "es"
          ? "Experiencia SGAS · Respuestas declaradas"
          : "ESMS experience · Declared answers"}
      </h3>
      <dl className="sgas-review">
        {sgasPresentation(source, locale).map((row, i) => (
          <div key={i}>
            <dt>{row.question}</dt>
            <dd>
              <strong>{row.answer}</strong>
              {row.detail && <p className="preserve-text">{row.detail}</p>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
