import Image from "next/image";
import Link from "next/link";
import { signIn, signUp, requestPasswordReset } from "@/app/auth/actions";
import { LanguageSwitch } from "./language-switch";
import type { Locale } from "@/lib/domain";
export function AuthForm({
  locale,
  register = false,
  params,
}: {
  locale: Locale;
  register?: boolean;
  params: {
    error?: string;
    next?: string;
    sent?: string;
    reset?: string;
    updated?: string;
  };
}) {
  const es = locale === "es";
  return (
    <main className="auth-shell" id="main-content">
      <section className="auth-card">
        <div className="live-actions">
          <Image
            src="/glf-logo.png"
            alt="Galápagos Life Fund"
            width={150}
            height={65}
          />
          <LanguageSwitch locale={locale} />
        </div>
        <h1>
          {register
            ? es
              ? "Crear cuenta"
              : "Create account"
            : es
              ? "Ingresar"
              : "Sign in"}
        </h1>
        <p>
          {es
            ? "Acceda con su correo electrónico al portal GLF."
            : "Access the GLF portal using your email."}
        </p>
        {params.error && (
          <p role="alert" className="auth-error">
            {params.error === "config"
              ? es
                ? "El acceso estará disponible al habilitar el portal."
                : "Access will be available when the portal is enabled."
              : es
                ? "No se pudo completar la solicitud. Revise sus datos e intente de nuevo."
                : "The request could not be completed. Check your details and try again."}
          </p>
        )}
        {(params.sent || params.reset) && (
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
        <form action={register ? signUp : signIn}>
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
          <label>
            {es ? "Correo electrónico" : "Email"}
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            {es ? "Contraseña" : "Password"}
            <input
              type="password"
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : undefined}
              maxLength={128}
              required
            />
          </label>
          {register && (
            <small>
              {es
                ? "Utilice una contraseña única de al menos 12 caracteres."
                : "Use a unique password of at least 12 characters."}
            </small>
          )}
          <button className="button primary" type="submit">
            {register
              ? es
                ? "Crear cuenta"
                : "Create account"
              : es
                ? "Ingresar"
                : "Sign in"}
          </button>
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
              <button className="button secondary">
                {es ? "Enviar instrucciones" : "Send instructions"}
              </button>
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
                ? "Crear cuenta de aplicante"
                : "Create an applicant account"}
          </Link>
        </p>
        <Link href="/">{es ? "Volver al portal" : "Back to the portal"}</Link>
      </section>
    </main>
  );
}
