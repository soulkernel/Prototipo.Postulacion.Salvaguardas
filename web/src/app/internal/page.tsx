import Link from "next/link";
import { requireViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { roleLabels, statusLabel } from "@/lib/fields";
import { signOut } from "@/app/auth/actions";
export default async function InternalPage() {
  const { db, profile } = await requireViewer([
    "grants_manager",
    "sustainability_reviewer",
    "project_coordinator",
    "committee_member",
    "administrator",
  ]);
  const locale = await getLocale();
  const es = locale === "es";
  const { data: apps, error } = await db
    .from("applications")
    .select("id,reference_code,payload,status,stage,updated_at")
    .not("submitted_at", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Cannot read applications");
  const calls = await getCalls();
  return (
    <Shell locale={locale} internal>
      <div className="live-title">
        <div>
          <h1>
            {es ? "Expedientes y decisiones" : "Applications and decisions"}
          </h1>
          <p>
            {profile.full_name} · {roleLabels[profile.role][es ? 0 : 1]}
          </p>
        </div>
        <form action={signOut}>
          <button className="button secondary">
            {es ? "Cerrar sesión" : "Sign out"}
          </button>
        </form>
      </div>
      <nav className="live-nav">
        {["grants_manager", "administrator"].includes(profile.role) && (
          <Link href="/internal/calls">
            {es ? "Gestionar convocatorias" : "Manage calls"}
          </Link>
        )}
        <Link href="/internal/reports">
          {es ? "Reportes de cierre" : "Closing reports"}
        </Link>
        {["sustainability_reviewer", "administrator"].includes(
          profile.role,
        ) && (
          <Link href="/internal/evidence">
            {es ? "Evidencia y asistente RAG" : "Evidence and RAG assistant"}
          </Link>
        )}
        {profile.role === "administrator" && (
          <Link href="/internal/users">
            {es ? "Usuarios y roles" : "Users and roles"}
          </Link>
        )}
      </nav>
      <div className="live-metrics">
        <div>
          {es ? "Convocatorias" : "Calls"}
          <strong>{calls.length}</strong>
        </div>
        <div>
          {es ? "Expedientes recibidos" : "Applications received"}
          <strong>{apps?.length || 0}</strong>
        </div>
        <div>
          {es ? "En revisión" : "In review"}
          <strong>
            {apps?.filter((a) =>
              ["submitted", "under_review", "phase2_submitted"].includes(
                a.status,
              ),
            ).length || 0}
          </strong>
        </div>
        <div>
          {es ? "Convenios firmados" : "Signed agreements"}
          <strong>
            {apps?.filter((a) => a.status === "contract_signed").length || 0}
          </strong>
        </div>
      </div>
      <section className="live-card">
        <h2>{es ? "Bandeja de expedientes" : "Application inbox"}</h2>
        {apps?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{es ? "Referencia" : "Reference"}</th>
                  <th>{es ? "Proyecto" : "Project"}</th>
                  <th>{es ? "Etapa" : "Stage"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td>{a.reference_code}</td>
                    <td>{a.payload?.concept?.title}</td>
                    <td>{statusLabel(a.status, locale)}</td>
                    <td>
                      <Link href={"/internal/applications/" + a.id}>
                        {es ? "Revisar" : "Review"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            {es
              ? "Todavía no se han recibido postulaciones."
              : "No applications have been received yet."}
          </p>
        )}
      </section>
    </Shell>
  );
}
