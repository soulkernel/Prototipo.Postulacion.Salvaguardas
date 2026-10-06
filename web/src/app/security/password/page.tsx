import { redirect } from "next/navigation";
import { getViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { updatePassword } from "@/app/auth/actions";
export default async function PasswordPage() {
  if (!(await getViewer())) redirect("/login");
  const locale = await getLocale();
  return (
    <Shell locale={locale}>
      <section className="live-card narrow">
        <h1>{locale === "es" ? "Nueva contraseña" : "New password"}</h1>
        <form action={updatePassword} className="live-form">
          <label>
            {locale === "es"
              ? "Contraseña (mínimo 12 caracteres)"
              : "Password (at least 12 characters)"}
            <input
              type="password"
              name="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <button className="button primary">
            {locale === "es" ? "Actualizar contraseña" : "Update password"}
          </button>
        </form>
      </section>
    </Shell>
  );
}
