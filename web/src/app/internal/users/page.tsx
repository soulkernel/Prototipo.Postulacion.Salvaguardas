import Link from "next/link";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { roles } from "@/lib/domain";
import { roleLabels } from "@/lib/fields";
export default async function UsersPage() {
  const { db, user } = await requireViewer(["administrator"]);
  const locale = await getLocale();
  const es = locale === "es";
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id,full_name,role,active")
    .order("full_name");
  if (error) throw new Error("Users unavailable");
  async function assign(form: FormData) {
    "use server";
    const { db } = await requireViewer(["administrator"]);
    const { error } = await db.rpc("assign_staff_role", {
      target_user: form.get("id"),
      assigned_role: form.get("role"),
    });
    if (error) redirect("/internal/users?error=1");
    redirect("/internal/users");
  }
  return (
    <Shell locale={locale} internal>
      <Link href="/internal">← GLF</Link>
      <h1>{es ? "Usuarios y roles" : "Users and roles"}</h1>
      <p>
        {es
          ? "Cada cambio de rol queda registrado. No puede modificar su propio rol desde esta pantalla."
          : "Each role change is recorded. You cannot change your own role from this screen."}
      </p>
      <section className="live-card">
        {profiles?.map((p) => (
          <form action={assign} className="document-row" key={p.id}>
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
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r][es ? 0 : 1]}
                </option>
              ))}
            </select>
            <button disabled={p.id === user.id} className="button secondary">
              {es ? "Actualizar rol" : "Update role"}
            </button>
          </form>
        ))}
      </section>
    </Shell>
  );
}
