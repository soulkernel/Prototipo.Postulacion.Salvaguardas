"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { prepareStaffLink } from "@/app/internal/users/actions";
import { ActionLabel } from "./submit-button";
import { invitationError, type StaffInvitation } from "@/lib/staff-invitations";
export function ManualStaffLink({
  invitation: i,
  es,
}: {
  invitation: StaffInvitation;
  es: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [url, setUrl] = useState(""),
    [error, setError] = useState("");
  return (
    <details>
      <summary>
        {es
          ? "Preparar enlace personal sin enviar correo"
          : "Prepare personal link without sending email"}
      </summary>
      <p>
        {es
          ? "Solo para esta persona. Vence en siete días; al generar otro se invalida el anterior. No se enviará correo automáticamente."
          : "For this recipient only. Expires in seven days; a replacement invalidates the previous link. No email is sent automatically."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          setUrl("");
          try {
            const r = await prepareStaffLink(i.id, i.updated_at);
            if (r.ok && r.url) {
              setUrl(r.url);
              router.refresh();
            } else setError(invitationError(r.error || "", es ? "es" : "en"));
          } catch {
            setError(invitationError("", es ? "es" : "en"));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          <input type="checkbox" required disabled={busy} />
          {es
            ? "Confirmo el destinatario y los permisos indicados"
            : "I confirm the recipient and the permissions shown"}
        </label>
        <button className="button primary" disabled={busy} aria-busy={busy}>
          <ActionLabel
            busy={busy}
            pendingLabel={es ? "Preparando acceso…" : "Preparing access…"}
          >
            {es ? "Generar enlace personal" : "Generate personal link"}
          </ActionLabel>
        </button>
      </form>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      {url && (
        <div role="status">
          <p>
            {es
              ? "Acceso preparado. Copie el enlace únicamente al correo de esta persona."
              : "Access prepared. Copy this link only into this recipient's email."}
          </p>
          <input
            aria-label={
              es ? "Enlace personal de activación" : "Personal activation link"
            }
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}
    </details>
  );
}
