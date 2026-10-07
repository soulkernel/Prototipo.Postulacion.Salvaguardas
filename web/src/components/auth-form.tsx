import Image from "next/image";
import Link from "next/link";
import {
  signIn,
  signUp,
  requestPasswordReset,
  resendConfirmation,
} from "@/app/auth/actions";
import { LanguageSwitch } from "./language-switch";
import type { Locale } from "@/lib/domain";
import { LoginFields } from "./login-fields";
import { SubmitButton } from "./submit-button";
export function AuthForm({
  locale,
  register = false,
  lastEmail = "",
  params,
}: {
  locale: Locale;
  register?: boolean;
  lastEmail?: string;
  params: {
    error?: string;
    next?: string;
    sent?: string;
    reset?: string;
    updated?: string;
    confirmation?: string;
  };
}) {
  const es = locale === "es";
  return (
    <main className="auth-shell" id="main-content">
      <section className="auth-card">
        <div className="auth-brand-panel">
          <Image
            src="/glf-logo.png"
            alt="Galápagos Life Fund"
            width={150}
            height={65}
          />
        </div>
        <div className="auth-language">
          <LanguageSwitch locale={locale} />
        </div>
        <h1>
          {register
            ? es
              ? "Crear cuenta"
              : "Create account"
            : es
              ? "Portal de subvenciones"
              : "Grant application portal"}
        </h1>
        <p>
          {register
            ? es
              ? "Registre su nombre, correo y una contraseña. Después confirme su correo mediante el enlace que recibirá para ingresar y preparar su postulación."
              : "Enter your name, email and a password. Then confirm your email using the link you receive to sign in and prepare your application."
            : es
              ? "Ingrese a su cuenta de Galápagos Life Fund para postular a sus subvenciones."
              : "Sign in to your Galápagos Life Fund account to apply for grants."}
        </p>
        {params.sent && (
          <p role="status" className="auth-success">
            {es
              ? "Verifique su correo electrónico: abra el mensaje de confirmación que le enviamos y pulse el enlace para activar su cuenta. Revise también la carpeta de spam. Después ingrese con su correo y contraseña."
              : "Verify your email: open the confirmation message we sent and follow its link to activate your account. Also check your spam folder. Then sign in with your email and password."}
          </p>
        )}
        {params.confirmation && (
          <p role="status" className="auth-success">
            {es
              ? "Para continuar después de confirmar su correo, ingrese con el correo electrónico y la contraseña que registró. Si necesita otro enlace, puede solicitarlo abajo."
              : "To continue after confirming your email, sign in with the email and password you registered. You can request another confirmation link below if needed."}
          </p>
        )}
        {params.reset && (
          <p role="status" className="auth-success">
            {es
              ? "Si el correo puede recibir esta solicitud, encontrará allí las instrucciones para continuar."
              : "If this email is eligible for this request, it will receive instructions to continue."}
          </p>
        )}
        {params.updated && (
          <p role="status">
            {es
              ? "Contraseña actualizada. Inicie sesión de nuevo."
              : "Password updated. Please sign in again."}
          </p>
        )}
        <form
          action={register ? signUp : signIn}
          autoComplete={register ? "on" : "off"}
        >
          {!register && (
            <input type="hidden" name="next" value={params.next || ""} />
          )}{" "}
          {register && (
            <label>
              {es ? "Nombre de contacto" : "Contact name"}
              <input
                name="full_name"
                autoComplete="name"
                required
                maxLength={200}
              />
            </label>
          )}
          {!register ? (
            <LoginFields locale={locale} lastEmail={lastEmail} />
          ) : (
            <>
              <label>
                {es ? "Correo electrónico" : "Email"}
                <input
                  type="email"
                  name="email"
                  autoComplete={register ? "email" : "off"}
                  defaultValue={register ? "" : lastEmail}
                  required
                  maxLength={254}
                />
              </label>
              <label>
                {es ? "Contraseña" : "Password"}
                <input
                  type="password"
                  name="password"
                  autoComplete={register ? "new-password" : "off"}
                  minLength={register ? 12 : undefined}
                  maxLength={128}
                  required
                />
              </label>
            </>
          )}
          {register && (
            <small>
              {es
                ? "Utilice una contraseña única de al menos 12 caracteres."
                : "Use a unique password of at least 12 characters."}
            </small>
          )}
          {!register && (
            <label className="remember-choice">
              <input type="checkbox" name="remember" />
              {es
                ? "Mantenerme conectado en este navegador durante 90 días"
                : "Keep me signed in on this browser for 90 days"}
            </label>
          )}
          {params.error && (
            <p role="alert" className="auth-error">
              {params.error === "config"
                ? es
                  ? "El acceso estará disponible al habilitar el portal."
                  : "Access will be available when the portal is enabled."
                : params.error === "email_not_confirmed"
                  ? es
                    ? "Confirme su correo electrónico antes de ingresar. Abra el mensaje de confirmación o solicite un nuevo enlace abajo."
                    : "Confirm your email before signing in. Open the confirmation email or request a new link below."
                  : params.error === "confirmation_link"
                    ? es
                      ? "El enlace de confirmación no es válido o ha vencido. Si ya confirmó su correo, ingrese con su contraseña. Si no, solicite un nuevo enlace abajo."
                      : "The confirmation link is invalid or expired. If you already confirmed your email, sign in with your password. Otherwise request a new link below."
                    : params.error === "confirmation_send"
                      ? es
                        ? "No se pudo reenviar el correo ahora. Espere unos minutos y vuelva a solicitarlo."
                        : "The email could not be resent now. Wait a few minutes and retry."
                      : es
                        ? "No se pudo completar la solicitud. Revise sus datos e intente de nuevo."
                        : "The request could not be completed. Check your details and try again."}
            </p>
          )}
          <SubmitButton
            pendingLabel={
              register
                ? es
                  ? "Creando cuenta…"
                  : "Creating account…"
                : es
                  ? "Ingresando…"
                  : "Signing in…"
            }
          >
            {register
              ? es
                ? "Crear cuenta"
                : "Create account"
              : es
                ? "Ingresar"
                : "Sign in"}
          </SubmitButton>
        </form>
        {!register && (
          <details>
            <summary>{es ? "Olvidé mi contraseña" : "Forgot password"}</summary>
            <form action={requestPasswordReset}>
              <label>
                {es ? "Correo electrónico" : "Email"}
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                />
              </label>
              <SubmitButton
                className="button secondary"
                pendingLabel={es ? "Enviando…" : "Sending…"}
              >
                {es ? "Enviar instrucciones" : "Send instructions"}
              </SubmitButton>
            </form>
          </details>
        )}
        {!register &&
          (params.confirmation ||
            [
              "email_not_confirmed",
              "confirmation_link",
              "confirmation_send",
            ].includes(params.error || "")) && (
            <details>
              <summary>
                {es
                  ? "Reenviar correo de confirmación"
                  : "Resend confirmation email"}
              </summary>
              <form action={resendConfirmation}>
                <label>
                  {es ? "Correo electrónico" : "Email"}
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                  />
                </label>
                <SubmitButton
                  className="button secondary"
                  pendingLabel={es ? "Enviando…" : "Sending…"}
                >
                  {es ? "Enviar nuevo enlace" : "Send new link"}
                </SubmitButton>
              </form>
            </details>
          )}
        <p>
          <Link href={register ? "/login" : "/register"}>
            {register
              ? es
                ? "Ya tengo una cuenta"
                : "I have an account"
              : es
                ? "¿No tiene una cuenta? Crear cuenta"
                : "No account yet? Create account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
