import Link from "next/link";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { roles } from "@/lib/domain";
import { roleLabels } from "@/lib/fields";
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { db, user, profile } = await requireViewer([
    "administrator",
    "grants_manager",
    "sustainability_reviewer",
  ]);
  if (profile.role !== "administrator" && profile.user_admin_scope === "none")
    redirect("/internal");
  const permittedRoles =
    profile.role === "administrator"
      ? roles
      : profile.user_admin_scope === "projects"
        ? ["project_coordinator"]
        : ["sustainability_reviewer"];
  const locale = await getLocale();
  const es = locale === "es";
  const params = await searchParams;
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id,full_name,role,active,user_admin_scope")
    .order("full_name");
  if (error) throw new Error("Users unavailable");
  const { data: invitations, error: invitationError } = await db
    .from("staff_invitation_drafts")
    .select("id,email,full_name,assigned_role,user_admin_scope")
    .order("full_name");
  if (invitationError) throw new Error("Invitations unavailable");
  async function prepareInvitation(form: FormData) {
    "use server";
    const { db } = await requireViewer([
      "administrator",
      "grants_manager",
      "sustainability_reviewer",
    ]);
    const { error } = await db.rpc("prepare_staff_invitation", {
      contact_email: form.get("email"),
      contact_name: form.get("full_name"),
      desired_role: form.get("role"),
      desired_scope: form.get("scope") || "none",
    });
    if (error) redirect("/internal/users?error=1");
    redirect("/internal/users");
  }
  async function assign(form: FormData) {
    "use server";
    const { db } = await requireViewer([
      "administrator",
      "grants_manager",
      "sustainability_reviewer",
    ]);
    const { error } = await db.rpc("assign_staff_role", {
      target_user: form.get("id"),
      assigned_role: form.get("role"),
    });
    if (error) redirect("/internal/users?error=1");
    redirect("/internal/users");
  }
  async function delegate(form: FormData) {
    "use server";
    const { db } = await requireViewer(["administrator"]);
    const { error } = await db.rpc("set_user_admin_scope", {
      target_user: form.get("id"),
      scope: form.get("scope"),
    });
    if (error) redirect("/internal/users?error=1");
    redirect("/internal/users");
  }
  return (
    <Shell locale={locale} internal>
      <Link href="/internal">← GLF</Link>
      <h1>{es ? "Usuarios y roles" : "Users and roles"}</h1>
      {params.error && (
        <p role="alert" className="auth-error">
          {es
            ? "No se pudo actualizar el rol. Revise los permisos y vuelva a intentarlo."
            : "The role could not be updated. Check permissions and retry."}
        </p>
      )}
      <p>
        {es
          ? "Cada cambio de rol queda registrado. No puede modificar su propio rol desde esta pantalla."
          : "Each role change is recorded. You cannot change your own role from this screen."}
      </p>
      <section className="live-card">
        <h2>{es ? "Preparar acceso interno" : "Prepare staff access"}</h2>
        <p>
          {es
            ? "Se guarda una propuesta de acceso. No se crea una cuenta ni se envía un correo desde esta pantalla."
            : "Saves a proposed staff access. This screen does not create an account or send email."}
        </p>
        <form action={prepareInvitation} className="live-form">
          <div className="live-grid">
            <label>
              {es ? "Nombre completo" : "Full name"}
              <input name="full_name" required maxLength={200} />
            </label>
            <label>
              {es ? "Correo institucional" : "Institutional email"}
              <input name="email" type="email" required maxLength={254} />
            </label>
            <label>
              {es ? "Rol propuesto" : "Proposed role"}
              <select name="role">
                {permittedRoles
                  .filter((r) => r !== "applicant")
                  .map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r][es ? 0 : 1]}
                    </option>
                  ))}
              </select>
            </label>
            {profile.role === "administrator" && (
              <label>
                {es ? "Administración por área" : "Area administration"}
                <select name="scope">
                  <option value="none">
                    {es ? "Sin delegación" : "No delegation"}
                  </option>
                  <option value="projects">
                    {es
                      ? "Proyectos (responsable de Proyectos)"
                      : "Projects (grants manager)"}
                  </option>
                  <option value="sustainability">
                    {es
                      ? "Sostenibilidad (responsable de Sostenibilidad)"
                      : "Sustainability (reviewer)"}
                  </option>
                </select>
              </label>
            )}
          </div>
          <button className="button secondary">
            {es ? "Guardar propuesta de acceso" : "Save proposed access"}
          </button>
        </form>
        <h3>
          {es
            ? "Accesos preparados — sin invitación enviada"
            : "Prepared access — no invitations sent"}
        </h3>
        {invitations?.map((i) => (
          <p key={i.id}>
            {i.full_name} · {i.email} ·{" "}
            {roleLabels[i.assigned_role as keyof typeof roleLabels][es ? 0 : 1]}
            {i.user_admin_scope !== "none"
              ? es
                ? " · Administración del área"
                : " · Area administration"
              : ""}
          </p>
        ))}
      </section>
      <section className="live-card">
        <h2>{es ? "Cuentas existentes" : "Existing accounts"}</h2>
        {profiles
          ?.filter(
            (p) =>
              profile.role === "administrator" ||
              (p.user_admin_scope === "none" && p.id !== user.id),
          )
          .map((p) => (
            <div key={p.id}>
              <form action={assign} className="document-row">
                <input type="hidden" name="id" value={p.id} />
                <span>
                  {p.full_name || p.id} ·{" "}
                  {p.active
                    ? es
                      ? "Activo"
                      : "Active"
                    : es
                      ? "Inactivo"
                      : "Inactive"}
                </span>
                <select
                  aria-label={es ? "Rol de usuario" : "User role"}
                  name="role"
                  defaultValue={p.role}
                  disabled={p.id === user.id}
                >
                  {permittedRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r][es ? 0 : 1]}
                    </option>
                  ))}
                </select>
                <button
                  disabled={p.id === user.id}
                  className="button secondary"
                >
                  {es ? "Actualizar rol" : "Update role"}
                </button>
              </form>
              {profile.role === "administrator" &&
                p.id !== user.id &&
                ["grants_manager", "sustainability_reviewer"].includes(
                  p.role,
                ) && (
                  <form action={delegate} className="document-row">
                    <input type="hidden" name="id" value={p.id} />
                    <label>
                      {es
                        ? "Administración de usuarios del área"
                        : "Area user administration"}
                      <select name="scope" defaultValue={p.user_admin_scope}>
                        <option value="none">
                          {es ? "Sin delegación" : "No delegation"}
                        </option>
                        <option
                          value={
                            p.role === "grants_manager"
                              ? "projects"
                              : "sustainability"
                          }
                        >
                          {p.role === "grants_manager"
                            ? es
                              ? "Proyectos"
                              : "Projects"
                            : es
                              ? "Sostenibilidad"
                              : "Sustainability"}
                        </option>
                      </select>
                    </label>
                    <button className="button secondary">
                      {es ? "Guardar delegación" : "Save delegation"}
                    </button>
                  </form>
                )}
            </div>
          ))}
      </section>
    </Shell>
  );
}
