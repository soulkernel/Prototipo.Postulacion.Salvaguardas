"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/domain";
import { rememberVerifiedSession } from "@/app/auth/actions";
export function MfaForm({
  locale,
  factorId,
  remembered = false,
}: {
  locale: Locale;
  factorId?: string;
  remembered?: boolean;
}) {
  const es = locale === "es";
  const router = useRouter();
  const [id, setId] = useState(factorId || "");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(remembered);
  async function enroll() {
    setBusy(true);
    setError("");
    try {
      const db = createSupabaseBrowserClient();
      const { data: existing } = await db.auth.mfa.listFactors();
      for (const factor of existing?.all || [])
        if (factor.factor_type === "totp" && factor.status === "unverified")
          await db.auth.mfa.unenroll({ factorId: factor.id });
      const { data, error } = await db.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "GLF",
      });
      if (error || !data) throw error;
      setId(data.id);
      setQr(data.totp.qr_code);
    } catch {
      setError(
        es
          ? "No fue posible iniciar la configuración."
          : "Could not start setup.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const db = createSupabaseBrowserClient();
      const { error } = await db.auth.mfa.challengeAndVerify({
        factorId: id,
        code,
      });
      if (error) throw error;
      const result = await rememberVerifiedSession(remember);
      if (!result.ok) throw new Error("Session preference failed");
      router.push("/internal");
      router.refresh();
    } catch {
      setError(
        es
          ? "Código inválido o vencido. Inténtelo de nuevo."
          : "Invalid or expired code. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="live-form">
      <p>
        {es
          ? "El personal GLF debe confirmar un segundo factor para acceder a expedientes y decisiones."
          : "GLF staff must confirm a second factor to access applications and decisions."}
      </p>
      {!id ? (
        <button className="button primary" onClick={enroll} disabled={busy}>
          {es
            ? "Configurar aplicación autenticadora"
            : "Set up authenticator app"}
        </button>
      ) : (
        <form className="live-form" onSubmit={verify}>
          {qr && (
            <div>
              <p>
                {es
                  ? "Escanee este QR con su aplicación autenticadora."
                  : "Scan this QR with your authenticator app."}
              </p>
              {/* Supabase supplies a local QR data URI; no external image request. */}
              <Image
                unoptimized
                width={200}
                height={200}
                className="mfa-qr"
                src={qr}
                alt={
                  es
                    ? "QR de configuración del autenticador"
                    : "Authenticator setup QR"
                }
              />
            </div>
          )}
          <label>
            {es ? "Código de 6 dígitos" : "6-digit code"}
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
            />
          </label>
          <label className="remember-choice">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            {es
              ? "Mantenerme conectado en este navegador durante 90 días"
              : "Keep me signed in on this browser for 90 days"}
          </label>
          <small>
            {es
              ? "Úselo en su equipo personal. Cerrar sesión, borrar las cookies o cambiar de navegador requerirá ingresar y verificar de nuevo."
              : "Use on your personal device. Signing out, clearing cookies or using another browser requires signing in and verifying again."}
          </small>
          <button
            className="button primary"
            disabled={busy || code.length !== 6}
          >
            {es ? "Verificar" : "Verify"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
