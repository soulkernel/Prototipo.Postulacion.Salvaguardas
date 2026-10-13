import { SubmitButton } from "@/components/submit-button";
import { StaffInvitations } from "@/components/staff-invitations";
import { invitationRoles, type StaffInvitation } from "@/lib/staff-invitations";
import Link from "@/components/feedback-link";
import { redirect } from "next/navigation";
import { requireViewer, getRequestTime } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { roles } from "@/lib/domain";
import { roleLabels } from "@/lib/fields";
import {
  AccountManagement,
  AcademicAccountForm,
} from "@/components/account-management";
import type { ManagedAccount } from "@/lib/account-management";
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
  const { data: accountRows, error } = await db.rpc("list_managed_accounts");
  const profiles = (accountRows || []) as ManagedAccount[];
  if (error) throw new Error("Users unavailable");
  const { data: invitations, error: invitationError } = await db
    .from("staff_invitation_drafts")
    .select(
      "id,email,full_name,assigned_role,user_admin_scope,status,updated_at,sent_at,expires_at,accepted_at,send_count,last_error,invited_user_id",
    )
    .order("full_name");
  if (invitationError) throw new Error("Invitations unavailable");
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
      <h1>{es ? "Gestión de usuarios" : "User management"}</h1>
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
      <StaffInvitations
        locale={locale}
        invitations={(invitations || []) as StaffInvitation[]}
        permittedRoles={invitationRoles(profile.role, profile.user_admin_scope)}
        administrator={profile.role === "administrator"}
        requestTime={await getRequestTime()}
      />
      {profile.role === "administrator" && <AcademicAccountForm es={es} />}
      <AccountManagement
        accounts={profiles}
        es={es}
        administrator={profile.role === "administrator"}
        userId={user.id}
        requestTime={await getRequestTime()}
      />
      <section className="live-card">
        <details>
          <summary>
            {es
              ? "Asignación de roles y delegación"
              : "Role assignment and delegation"}
          </summary>
          {profiles
            ?.filter(
              (p) =>
                p.access_kind !== "academic" &&
                !p.archived_at &&
                !invitations?.some(
                  (i) => i.invited_user_id === p.id && i.status !== "accepted",
                ) &&
                (profile.role === "administrator" ||
                  (p.user_admin_scope === "none" && p.id !== user.id)),
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
                  <SubmitButton
                    pendingLabel={es ? "Procesando…" : "Processing…"}
                    disabled={p.id === user.id}
                    className="button secondary"
                  >
                    {es ? "Actualizar rol" : "Update role"}
                  </SubmitButton>
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
                      <SubmitButton
                        pendingLabel={es ? "Procesando…" : "Processing…"}
                        className="button secondary"
                      >
                        {es ? "Guardar delegación" : "Save delegation"}
                      </SubmitButton>
                    </form>
                  )}
              </div>
            ))}
        </details>
      </section>
    </Shell>
  );
}
