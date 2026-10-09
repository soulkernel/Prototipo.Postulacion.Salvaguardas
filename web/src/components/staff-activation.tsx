"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { activateStaffAccount } from "@/app/auth/activate/actions";
import { invitationError } from "@/lib/staff-invitations";
import type { Locale } from "@/lib/domain";
import { roleLabels } from "@/lib/fields";
import { ActionLabel } from "./submit-button";
type Activation = {
  email: string;
  full_name: string;
  assigned_role: keyof typeof roleLabels;
  status: string;
  expires_at: string;
};
export function StaffActivation({
  locale,
  invitationId,
}: {
  locale: Locale;
  invitationId: string;
}) {
  const es = locale === "es";
  const router = useRouter();
  const [details, setDetails] = useState<Activation | null>(null);
  const [resolvedId, setResolvedId] = useState(invitationId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const db = createSupabaseBrowserClient();
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const access_token = fragment.get("access_token");
        const refresh_token = fragment.get("refresh_token");
        // Invitation links work across devices. Tokens never enter application logs or URLs sent to the server.
        if (window.location.hash)
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        if (access_token && refresh_token) {
          const { error } = await db.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
        }
        const {
          data: { user },
          error: authError,
        } = await db.auth.getUser();
        if (authError || !user) throw new Error();
        const id = invitationId || user.user_metadata.glf_invitation_id;
        if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id))
          throw new Error();
        const { data, error } = await db.rpc("get_staff_activation", {
          invitation_id: id,
        });
        if (
          error ||
          !data ||
          data.status !== "sent" ||
          Date.parse(data.expires_at) <= Date.now()
        )
          throw new Error();
        if (active) {
          setResolvedId(id);
          setDetails(data as Activation);
        }
      } catch {
        if (active) setError(invitationError("GLF_INVITATION_EXPIRED", locale));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [invitationId, locale]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await activateStaffAccount(
        new FormData(event.currentTarget),
      );
      if (!result.ok) {
        setError(
          result.error === "password"
            ? es
              ? "Las contraseñas deben coincidir, tener entre 12 y 128 caracteres y cumplir la política de seguridad."
              : "Passwords must match, contain 12–128 characters and meet the security policy."
            : invitationError(result.error || "", locale),
        );
        setBusy(false);
        return;
      }
      router.replace("/security");
      router.refresh();
    } catch {
      setError(invitationError("", locale));
      setBusy(false);
    }
  }
  return (
    <>
      {!details && !error && (
        <p role="status">
          {es ? "Comprobando invitación…" : "Checking invitation…"}
        </p>
      )}
      {details && (
        <>
          <p>
            {details.full_name} · {details.email}
          </p>
          <p className="field-help">
            {roleLabels[details.assigned_role][es ? 0 : 1]}
          </p>
          <p>
            {es
              ? "Defina su contraseña personal. Después deberá configurar una aplicación autenticadora para acceder al panel interno. No necesita una cuenta de Supabase ni de Vercel."
              : "Set your personal password. Then configure an authenticator app to access the staff panel. You do not need a Supabase or Vercel account."}
          </p>
          <form onSubmit={submit}>
            <input type="hidden" name="id" value={resolvedId} />
            <label>
              {es ? "Nueva contraseña *" : "New password *"}
              <input
                type="password"
                name="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                disabled={busy}
              />
            </label>
            <label>
              {es ? "Repita la contraseña *" : "Repeat password *"}
              <input
                type="password"
                name="confirm"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                disabled={busy}
              />
            </label>
            {error && (
              <p role="alert" className="auth-error">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy} aria-busy={busy}>
              <ActionLabel
                busy={busy}
                pendingLabel={es ? "Activando cuenta…" : "Activating account…"}
              >
                {es
                  ? "Activar cuenta y configurar seguridad"
                  : "Activate account and set up security"}
              </ActionLabel>
            </button>
          </form>
        </>
      )}
      {!details && error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <p>
        <Link href="/login">{es ? "Volver al acceso" : "Back to sign in"}</Link>
      </p>
    </>
  );
}
