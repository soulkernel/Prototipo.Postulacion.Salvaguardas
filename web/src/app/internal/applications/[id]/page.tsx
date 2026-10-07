import { getRequestTime } from "@/lib/data";
import Link from "next/link";
import { getApplication, requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { UploadForm } from "@/components/upload-form";
import { identityFields, narrativeFields, statusLabel } from "@/lib/fields";
import { riskScore, riskLevel } from "@/lib/domain";
import {
  recordReview,
  recordDecision,
  reopenApplication,
  recordAgreement,
} from "../../actions";
export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const requestTime = await getRequestTime();
  await requireViewer([
    "grants_manager",
    "sustainability_reviewer",
    "project_coordinator",
    "committee_member",
    "administrator",
  ]);
  const { id } = await params;
  const { viewer, application: a } = await getApplication(id);
  const locale = await getLocale();
  const es = locale === "es";
  const feedback = await searchParams;
  const [
    { data: reviews },
    { data: decisions },
    { data: versions },
    { data: docs },
    { data: events },
  ] = await Promise.all([
    viewer.db
      .from("technical_reviews")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    viewer.db
      .from("governance_decisions")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    viewer.db
      .from("application_versions")
      .select("id,revision,stage,payload")
      .eq("application_id", id)
      .order("revision", { ascending: false }),
    viewer.db
      .from("application_documents")
      .select("id,file_name,kind")
      .eq("application_id", id),
    viewer.db
      .from("application_events")
      .select("event_type,detail,created_at")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (versions?.[0]?.payload) a.payload = versions[0].payload;
  const role = viewer.profile.role;
  const underReview = [
    "submitted",
    "under_review",
    "phase2_submitted",
  ].includes(a.status);
  const hidden = (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="revision" value={a.revision} />
    </>
  );
  return (
    <Shell locale={locale} internal>
      <Link href="/internal">← {es ? "Expedientes" : "Applications"}</Link>
      <div className="live-title">
        <div>
          <p className="eyebrow">
            {a.reference_code} · {es ? "Revisión" : "Revision"} {a.revision}
          </p>
          <h1>{a.payload.concept.title}</h1>
        </div>
        <span className="status-pill neutral">
          {statusLabel(a.status, locale)}
        </span>
      </div>
      {feedback.error && (
        <p role="alert" className="auth-error">
          {es
            ? "No se registró la operación. Verifique la etapa, la revisión vigente y los campos requeridos."
            : "The operation was not recorded. Check the stage, current review and required fields."}{" "}
          <code>{feedback.error}</code>
        </p>
      )}
      {feedback.saved && (
        <p role="status" className="auth-success">
          {es ? "Operación registrada." : "Operation recorded."}
        </p>
      )}
      {a.correction_deadline &&
        Date.parse(a.correction_deadline) > requestTime && (
          <div className="live-notice">
            {es
              ? "El aplicante tiene una corrección autorizada. Espere su reenvío antes de emitir una decisión."
              : "The applicant has an authorized correction window. Wait for resubmission before deciding."}
          </div>
        )}
      <section className="live-card">
        <h2>{es ? "Documentos y versiones" : "Documents and versions"}</h2>
        {versions?.map((v) => (
          <div className="document-row" key={v.id}>
            <span>
              {es ? "Versión" : "Version"} {v.revision} ·{" "}
              {es ? "Fase" : "Phase"} {v.stage}
            </span>
            <div className="live-actions">
              <a href={"/documents/" + v.id + "/concept"}>
                {es ? "Nota Conceptual PDF" : "Concept Note PDF"}
              </a>
              <a href={"/documents/" + v.id + "/matrix"}>
                {es ? "Matriz PDF" : "Matrix PDF"}
              </a>
            </div>
          </div>
        ))}
        {docs?.map((d) => (
          <div className="document-row" key={d.id}>
            <span>
              {d.kind} · {d.file_name}
            </span>
            <a href={"/files/" + d.id}>{es ? "Descargar" : "Download"}</a>
          </div>
        ))}
      </section>
      <section className="live-card">
        <details>
          <summary>
            {es ? "Nota Conceptual completa" : "Complete Concept Note"}
          </summary>
          <dl className="summary-list">
            {[...identityFields, ...narrativeFields].map((f) => (
              <div key={f.key}>
                <dt>{es ? f.es : f.en}</dt>
                <dd>{String(a.payload.concept[f.key] ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </details>
      </section>
      <section className="live-card">
        <h2>
          {es
            ? "Actividades y riesgos declarados"
            : "Declared activities and risks"}
        </h2>
        {a.payload.activities.map((activity) => (
          <article key={activity.id}>
            <h3>{activity.title}</h3>
            <p>{activity.description}</p>
            {!activity.risks.length && <p>{activity.no_risks_reason}</p>}
            {activity.risks.map((r) => (
              <div className="live-risk" key={r.id}>
                <h4>
                  {r.name} · {r.dimension}
                </h4>
                <p>{r.description}</p>
                <p>
                  {es ? "Riesgo inicial" : "Initial risk"}:{" "}
                  {riskScore(r.probability, r.severity)} (
                  {riskLevel(riskScore(r.probability, r.severity))})
                  {a.stage === 2 && (
                    <>
                      {" "}
                      / {es ? "Residual" : "Residual"}:{" "}
                      {riskScore(r.residual_probability, r.residual_severity)} (
                      {riskLevel(
                        riskScore(r.residual_probability, r.residual_severity),
                      )}
                      )
                    </>
                  )}
                </p>
                {a.stage === 2 && (
                  <>
                    <ul>
                      {r.measures.map((m, i) => (
                        <li key={i}>
                          {m.text || m.label_es || m.label_en || m.catalog_id}
                          {m.normative_reference && (
                            <small> · {m.normative_reference}</small>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p>
                      {r.location} · USD {r.cost} · {r.responsible} · T
                      {r.start_quarter}–T{r.end_quarter}
                    </p>
                  </>
                )}
              </div>
            ))}
          </article>
        ))}
      </section>
      {underReview &&
        [
          "grants_manager",
          "sustainability_reviewer",
          "project_coordinator",
        ].includes(role) && (
          <section className="live-card">
            <h2>
              {es ? "Registrar revisión de mi área" : "Record my area's review"}
            </h2>
            <form action={recordReview} className="live-form">
              {hidden}
              <label>
                {es ? "Hallazgos y evidencia" : "Findings and evidence"}
                <textarea name="findings" required maxLength={12000} />
              </label>
              <label>
                {es ? "Recomendación técnica" : "Technical recommendation"}
                <textarea name="recommendation" required maxLength={12000} />
              </label>
              {role === "sustainability_reviewer" && (
                <label>
                  {es
                    ? "Categoría global confirmada por el especialista (opcional)"
                    : "Specialist-confirmed overall category (optional)"}
                  <input name="category" maxLength={100} />
                  <small>
                    {es
                      ? "No se calcula automáticamente a partir de la suma."
                      : "Not automatically derived from the score sum."}
                  </small>
                </label>
              )}
              <button className="button primary">
                {es ? "Guardar revisión" : "Save review"}
              </button>
            </form>
          </section>
        )}
      {underReview && role === "grants_manager" && (
        <section className="live-card">
          <h2>{es ? "Autorizar corrección" : "Authorize a correction"}</h2>
          <form action={reopenApplication} className="live-form">
            {hidden}
            <label>
              {es ? "Fecha límite (Galápagos)" : "Deadline (Galápagos time)"}
              <input type="datetime-local" name="deadline" required />
            </label>
            <label>
              {es
                ? "Corrección solicitada al aplicante"
                : "Correction requested from applicant"}
              <textarea name="reason" required />
            </label>
            <button className="button secondary">
              {es ? "Autorizar reapertura" : "Authorize reopening"}
            </button>
          </form>
        </section>
      )}
      {underReview && role === "committee_member" && (
        <section className="live-card">
          <h2>{es ? "Registrar resolución" : "Record a decision"}</h2>
          <form action={recordDecision} className="live-form">
            {hidden}
            <label>
              {es ? "Órgano" : "Decision-making body"}
              <select name="body">
                <option value="CAT">CAT</option>
                <option value="committee">{es ? "Comité" : "Committee"}</option>
                <option value="council">{es ? "Consejo" : "Council"}</option>
              </select>
            </label>
            <label>
              {es ? "Decisión" : "Decision"}
              <select name="decision">
                {a.stage === 1 ? (
                  <>
                    <option value="recommend">
                      {es
                        ? "Emitir recomendación CAT"
                        : "Record CAT recommendation"}
                    </option>
                    <option value="invite">
                      {es ? "Invitar a Fase 2" : "Invite to Phase 2"}
                    </option>
                    <option value="not_select">
                      {es ? "No seleccionar" : "Do not select"}
                    </option>
                  </>
                ) : (
                  <>
                    <option value="approve">
                      {es
                        ? "Aprobar proyecto completo"
                        : "Approve full proposal"}
                    </option>
                    <option value="reject">
                      {es ? "No aprobar" : "Do not approve"}
                    </option>
                  </>
                )}
              </select>
            </label>
            {a.stage === 2 && (
              <label>
                {es
                  ? "Monto aprobado por el órgano (USD)"
                  : "Amount approved by the body (USD)"}
                <input
                  type="number"
                  name="approved_amount"
                  min="0.01"
                  step="0.01"
                />
              </label>
            )}
            <label>
              {es
                ? "Referencia de acta o resolución"
                : "Minutes or resolution reference"}
              <input name="reference" required />
            </label>
            <label>
              {es ? "Fundamentación" : "Rationale"}
              <textarea name="rationale" required />
            </label>
            {a.stage === 1 && (
              <label>
                {es
                  ? "Plazo de Fase 2, solo para invitaciones (Galápagos)"
                  : "Phase 2 deadline, invitations only (Galápagos time)"}
                <input type="datetime-local" name="deadline" />
              </label>
            )}
            <button className="button primary">
              {es ? "Registrar resolución" : "Record decision"}
            </button>
          </form>
        </section>
      )}
      {a.status === "approved" && role === "grants_manager" && (
        <section className="live-card">
          <h2>{es ? "Convenio firmado" : "Signed agreement"}</h2>
          <UploadForm applicationId={id} locale={locale} kind="agreement" />
          <form action={recordAgreement} className="live-form">
            {hidden}
            <label>
              {es ? "Documento firmado" : "Signed document"}
              <select name="document_id" required>
                <option value="">{es ? "Seleccione" : "Select"}</option>
                {docs
                  ?.filter((d) => d.kind === "agreement")
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.file_name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {es ? "Referencia del convenio" : "Agreement reference"}
              <input name="reference" required />
            </label>
            <div className="live-grid">
              <label>
                {es ? "Monto aprobado USD" : "Approved amount USD"}
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>
              <label>
                {es ? "Cofinanciamiento USD" : "Cofinancing USD"}
                <input
                  type="number"
                  name="cofinance"
                  min="0"
                  step="0.01"
                  required
                />
              </label>
              <label>
                {es ? "Firma GLF" : "GLF signature"}
                <input type="date" name="glf_date" required />
              </label>
              <label>
                {es ? "Firma beneficiario" : "Grantee signature"}
                <input type="date" name="applicant_date" required />
              </label>
            </div>
            <button className="button primary">
              {es ? "Registrar convenio firmado" : "Record signed agreement"}
            </button>
          </form>
        </section>
      )}
      <section className="live-card">
        <h2>{es ? "Historia de revisión" : "Review history"}</h2>
        {reviews?.map((r) => (
          <div className="document-row" key={r.id}>
            <div>
              <strong>
                {r.review_type} · v{r.revision}
              </strong>
              <p className="preserve-text">{r.findings}</p>
              <p>{r.recommendation}</p>
              {r.global_risk_category && <p>{r.global_risk_category}</p>}
            </div>
          </div>
        ))}
        {decisions?.map((d) => (
          <p key={d.id}>
            {d.body} · {d.decision} · {d.reference}
          </p>
        ))}
        {events?.map((e, i) => (
          <p key={i}>
            {new Date(e.created_at).toLocaleString(locale, {
              timeZone: "Pacific/Galapagos",
            })}{" "}
            · {e.event_type}
          </p>
        ))}
      </section>
    </Shell>
  );
}
