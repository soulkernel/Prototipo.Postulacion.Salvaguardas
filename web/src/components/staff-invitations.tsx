"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, UserPlus } from "lucide-react";
import {
  prepareStaffInvitation,
  sendStaffInvitation,
  cancelStaffInvitation,
  checkStaffInvitationService,
} from "@/app/internal/users/actions";
import { invitationError, type StaffInvitation } from "@/lib/staff-invitations";
import { roleLabels } from "@/lib/fields";
import type { Locale, Role } from "@/lib/domain";
import { ActionLabel } from "./submit-button";

export function StaffInvitations({
  locale,
  invitations,
  permittedRoles,
  administrator,
  requestTime,
}: {
  locale: Locale;
  invitations: StaffInvitation[];
  permittedRoles: Role[];
  administrator: boolean;
  requestTime: number;
}) {
  const es = locale === "es";
  const router = useRouter();
  const [editing, setEditing] = useState<StaffInvitation | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>(permittedRoles[0]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<{ id: string; text: string } | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; text: string } | null>(
    null,
  );
  const labels = {
    draft: ["Pendiente de envío", "Ready to send"],
    sending: ["Enviando", "Sending"],
    sent: ["Enviada · pendiente de activación", "Sent · awaiting activation"],
    failed: ["Envío fallido", "Delivery failed"],
    accepted: ["Cuenta activada", "Account activated"],
    cancelled: ["Cancelada", "Cancelled"],
  };
  const date = (v: string) =>
    new Intl.DateTimeFormat(es ? "es-EC" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Pacific/Galapagos",
    }).format(new Date(v));
  async function operate(
    event: React.FormEvent<HTMLFormElement>,
    key: string,
    action: typeof sendStaffInvitation,
    success: string,
  ) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(key);
    setError(null);
    setFeedback(null);
    try {
      const result = await action(data);
      if (!result.ok)
        setError({
          id: key,
          text: invitationError(result.error || "", locale),
        });
      else {
        setFeedback({ id: key, text: success });
        if (key === "prepare") {
          form.reset();
          setEditing(null);
          setSelectedRole(permittedRoles[0]);
        }
      }
      router.refresh();
    } catch {
      setError({ id: key, text: invitationError("", locale) });
    } finally {
      setBusy("");
    }
  }
  const notice = (id: string) => (
    <>
      {error?.id === id && (
        <p role="alert" className="auth-error">
          {error.text}
        </p>
      )}
      {feedback?.id === id && (
        <p role="status" className="auth-success">
          {feedback.text}
        </p>
      )}
    </>
  );
  return (
    <>
      <section className="live-card" id="prepare-staff-invitation">
        <h2>
          <UserPlus size={22} aria-hidden="true" />{" "}
          {es ? "Invitar personal interno del GLF" : "Invite GLF staff"}
        </h2>
        <p>
          {es
            ? "1. Prepare el nombre y los permisos. 2. Revise la invitación pendiente. 3. Pulse Enviar invitación. El destinatario recibirá un enlace para definir su contraseña y configurar el segundo factor."
            : "1. Prepare the name and permissions. 2. Review the pending invitation. 3. Select Send invitation. The recipient receives a link to set a password and configure a second factor."}
        </p>
        <p className="field-help">
          {es
            ? "Este formulario es exclusivamente para personal interno. Los postulantes crean su cuenta desde la pantalla de acceso. Guardar aquí no envía correos."
            : "This form is exclusively for staff. Applicants register from the sign-in page. Saving here does not send email."}
        </p>
        <form
          key={editing?.id || "new"}
          className="live-form"
          onSubmit={(e) =>
            operate(
              e,
              "prepare",
              prepareStaffInvitation,
              es
                ? "Invitación guardada. Revísela abajo y pulse Enviar invitación cuando corresponda."
                : "Invitation saved. Review it below and select Send invitation when ready.",
            )
          }
        >
          <fieldset disabled={!!busy} className="live-fieldset live-grid">
            <label>
              {es ? "Nombre completo *" : "Full name *"}
              <input
                name="full_name"
                required
                minLength={2}
                maxLength={200}
                defaultValue={editing?.full_name || ""}
                autoComplete="off"
              />
            </label>
            <label>
              {es ? "Correo del destinatario *" : "Recipient email *"}
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                defaultValue={editing?.email || ""}
                readOnly={!!editing}
                autoComplete="off"
              />
              <small>
                {es
                  ? "Revise cuidadosamente la dirección institucional; recibirá el acceso interno."
                  : "Carefully check the institutional address; it will receive staff access."}
              </small>
            </label>
            <label>
              {es ? "Funciones del usuario *" : "User responsibilities *"}
              <select
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
              >
                {permittedRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r][es ? 0 : 1]}
                  </option>
                ))}
              </select>
            </label>
            {administrator && (
              <label>
                {es
                  ? "Administración de usuarios del área"
                  : "Area user administration"}
                <select
                  name="scope"
                  key={selectedRole}
                  defaultValue={
                    editing?.assigned_role === selectedRole
                      ? editing.user_admin_scope
                      : "none"
                  }
                >
                  <option value="none">
                    {selectedRole === "administrator"
                      ? es
                        ? "Administración general incluida en el rol"
                        : "General administration included in role"
                      : es
                        ? "Sin delegación"
                        : "No delegation"}
                  </option>
                  {selectedRole === "grants_manager" && (
                    <option value="projects">
                      {es
                        ? "Administrar usuarios de Proyectos"
                        : "Manage Projects users"}
                    </option>
                  )}
                  {selectedRole === "sustainability_reviewer" && (
                    <option value="sustainability">
                      {es
                        ? "Administrar usuarios de Sostenibilidad"
                        : "Manage Sustainability users"}
                    </option>
                  )}
                </select>
              </label>
            )}
          </fieldset>
          {selectedRole === "administrator" && (
            <p className="field-help">
              {es
                ? "Este rol otorga administración general. Revíselo cuidadosamente antes de enviar."
                : "This role grants general administration. Review it carefully before sending."}
            </p>
          )}
          {notice("prepare")}
          <div className="live-actions">
            <button
              className="button secondary"
              disabled={!!busy}
              aria-busy={busy === "prepare"}
            >
              <ActionLabel
                busy={busy === "prepare"}
                pendingLabel={es ? "Guardando…" : "Saving…"}
              >
                {editing
                  ? es
                    ? "Guardar cambios"
                    : "Save changes"
                  : es
                    ? "Guardar invitación pendiente"
                    : "Save pending invitation"}
              </ActionLabel>
            </button>
            {editing && (
              <button
                type="button"
                className="button ghost"
                disabled={!!busy}
                onClick={() => {
                  setEditing(null);
                  setSelectedRole(permittedRoles[0]);
                }}
              >
                {es ? "Salir de edición" : "Exit editing"}
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="live-card">
        <h2>
          <Mail size={22} aria-hidden="true" />{" "}
          {es
            ? "Invitaciones y estado de activación"
            : "Invitations and activation status"}
        </h2>
        <p className="field-help">
          {es
            ? "Enviada significa que el servicio aceptó el correo; no confirma su entrega a la bandeja. La cuenta se habilita al activar la invitación. Fechas en hora de Galápagos."
            : "Sent means the email service accepted the message; inbox delivery is not confirmed. The account is enabled on activation. Dates use Galápagos time."}
        </p>
        <div className="live-actions">
          <button
            type="button"
            className="button ghost"
            disabled={!!busy}
            aria-busy={busy === "service"}
            onClick={async () => {
              if (busy) return;
              setBusy("service");
              setError(null);
              setFeedback(null);
              try {
                const result = await checkStaffInvitationService();
                if (result.ok)
                  setFeedback({
                    id: "service",
                    text: es
                      ? "Servicio conectado. No se envió ningún correo. La entrega a destinatarios depende del SMTP configurado."
                      : "Service connected. No email was sent. Recipient delivery depends on the SMTP configuration.",
                  });
                else
                  setError({
                    id: "service",
                    text: invitationError(result.error || "", locale),
                  });
              } catch {
                setError({
                  id: "service",
                  text: invitationError("GLF_INVITATION_CONFIG", locale),
                });
              } finally {
                setBusy("");
              }
            }}
          >
            <ActionLabel
              busy={busy === "service"}
              pendingLabel={es ? "Comprobando…" : "Checking…"}
            >
              {es
                ? "Comprobar servicio de invitaciones"
                : "Check invitation service"}
            </ActionLabel>
          </button>
        </div>
        {notice("service")}
        {!invitations.length && (
          <p>
            {es
              ? "Todavía no hay invitaciones. Prepare la primera en el formulario de arriba."
              : "No invitations yet. Prepare the first one above."}
          </p>
        )}
        <div className="staff-invitation-list">
          {invitations.map((i) => {
            const expired =
              i.status === "sent" &&
              i.expires_at &&
              Date.parse(i.expires_at) <= requestTime;
            const sendKey = i.id + ":send";
            const cancelKey = i.id + ":cancel";
            const retry = i.send_count > 0;
            return (
              <article className="staff-invitation-row" key={i.id}>
                <div className="staff-invitation-heading">
                  <strong>{i.full_name}</strong>
                  <span
                    className={"staff-invitation-status status-" + i.status}
                  >
                    {expired
                      ? es
                        ? "Vencida · requiere reenvío"
                        : "Expired · resend required"
                      : labels[i.status][es ? 0 : 1]}
                  </span>
                </div>
                <p>{i.email}</p>
                <p className="field-help">
                  {roleLabels[i.assigned_role][es ? 0 : 1]}
                  {i.user_admin_scope !== "none"
                    ? es
                      ? " · Administración del área"
                      : " · Area administration"
                    : ""}
                </p>
                {i.sent_at && (
                  <p className="field-help">
                    {es ? "Último envío: " : "Last sent: "}
                    {date(i.sent_at)} · {es ? "Envíos: " : "Sends: "}
                    {i.send_count}
                  </p>
                )}
                {i.accepted_at && (
                  <p className="field-help">
                    {es ? "Activada: " : "Activated: "}
                    {date(i.accepted_at)}
                  </p>
                )}
                {i.status === "failed" && i.last_error && (
                  <p className="auth-error">
                    {invitationError(i.last_error, locale)}
                  </p>
                )}
                {notice(sendKey)}
                {notice(cancelKey)}
                <div className="live-actions">
                  {["draft", "failed", "cancelled"].includes(i.status) && (
                    <button
                      type="button"
                      className="button ghost"
                      disabled={!!busy}
                      onClick={() => {
                        setEditing(i);
                        setSelectedRole(i.assigned_role);
                        document
                          .getElementById("prepare-staff-invitation")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {es ? "Editar datos" : "Edit details"}
                    </button>
                  )}
                  {!["accepted", "cancelled"].includes(i.status) && (
                    <details className="invitation-confirmation">
                      <summary>
                        {retry
                          ? es
                            ? "Reenviar invitación"
                            : "Resend invitation"
                          : es
                            ? "Enviar invitación"
                            : "Send invitation"}
                      </summary>
                      <form
                        className="live-form"
                        onSubmit={(e) =>
                          operate(
                            e,
                            sendKey,
                            sendStaffInvitation,
                            es
                              ? "Invitación enviada. El destinatario debe abrir el correo y activar su cuenta."
                              : "Invitation sent. The recipient must open the email and activate the account.",
                          )
                        }
                      >
                        <input type="hidden" name="id" value={i.id} />
                        <input
                          type="hidden"
                          name="updated_at"
                          value={i.updated_at}
                        />
                        <p>
                          {es
                            ? "Se enviará un enlace de activación a "
                            : "An activation link will be sent to "}
                          <strong>{i.email}</strong>.
                        </p>
                        <label className="remember-choice">
                          <input
                            type="checkbox"
                            name="confirmed"
                            required
                            disabled={!!busy}
                          />
                          {es
                            ? "Confirmo el destinatario, el rol y los permisos indicados."
                            : "I confirm the recipient, role and permissions shown."}
                        </label>
                        <button
                          className="button primary"
                          disabled={
                            !!busy ||
                            (i.status === "sending" &&
                              requestTime - Date.parse(i.updated_at) < 300000)
                          }
                          aria-busy={busy === sendKey}
                        >
                          <ActionLabel
                            busy={busy === sendKey}
                            pendingLabel={
                              es
                                ? "Enviando invitación…"
                                : "Sending invitation…"
                            }
                          >
                            <Send size={16} />
                            {es
                              ? "Confirmar y enviar invitación"
                              : "Confirm and send invitation"}
                          </ActionLabel>
                        </button>
                      </form>
                    </details>
                  )}
                  {!["accepted", "cancelled", "sending"].includes(i.status) && (
                    <details className="invitation-confirmation">
                      <summary>
                        {es ? "Cancelar invitación" : "Cancel invitation"}
                      </summary>
                      <form
                        className="live-form"
                        onSubmit={(e) =>
                          operate(
                            e,
                            cancelKey,
                            cancelStaffInvitation,
                            es
                              ? "Invitación cancelada. Ya no permite habilitar una cuenta interna."
                              : "Invitation cancelled. It can no longer enable a staff account.",
                          )
                        }
                      >
                        <input type="hidden" name="id" value={i.id} />
                        <input
                          type="hidden"
                          name="updated_at"
                          value={i.updated_at}
                        />
                        <label className="remember-choice">
                          <input
                            type="checkbox"
                            name="confirmed"
                            required
                            disabled={!!busy}
                          />
                          {es
                            ? "Confirmo que esta invitación debe quedar sin efecto."
                            : "I confirm this invitation must be cancelled."}
                        </label>
                        <button
                          className="button secondary"
                          disabled={!!busy}
                          aria-busy={busy === cancelKey}
                        >
                          <ActionLabel
                            busy={busy === cancelKey}
                            pendingLabel={es ? "Cancelando…" : "Cancelling…"}
                          >
                            {es
                              ? "Confirmar cancelación"
                              : "Confirm cancellation"}
                          </ActionLabel>
                        </button>
                      </form>
                    </details>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
