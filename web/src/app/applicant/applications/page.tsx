import Link from "next/link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { statusLabel } from "@/lib/fields";
import { Shell } from "@/components/shell";
import { signOut } from "@/app/auth/actions";
export default async function MyApplicationsPage() {
  const viewer = await requireViewer(["applicant"]);
  const locale = await getLocale();
  const es = locale === "es";
  const { data: rows, error } = await viewer.db
    .from("applications")
    .select("id,reference_code,payload,status,updated_at")
    .eq("applicant_id", viewer.user.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Cannot read applications");
  return (
    <Shell locale={locale}>
      <div className="live-title">
        <div>
          <p className="eyebrow">{viewer.profile.full_name}</p>
          <h1>{es ? "Mis postulaciones" : "My applications"}</h1>
          <p>
            {es
              ? "Sus borradores y expedientes enviados."
              : "Your drafts and submitted applications."}
          </p>
        </div>
        <form action={signOut}>
          <button className="button secondary">
            {es ? "Cerrar sesión" : "Sign out"}
          </button>
        </form>
      </div>
      <section className="live-card" id="expedientes">
        <h2>{es ? "Expedientes" : "Applications"}</h2>
        {rows?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{es ? "Referencia" : "Reference"}</th>
                  <th>{es ? "Proyecto" : "Project"}</th>
                  <th>{es ? "Estado" : "Status"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.reference_code}</td>
                    <td>
                      {row.payload?.concept?.title ||
                        (es ? "Sin título" : "Untitled")}
                    </td>
                    <td>{statusLabel(row.status, locale)}</td>
                    <td>
                      <Link href={"/applicant/" + row.id}>
                        {es ? "Abrir" : "Open"}
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
              ? "Aquí aparecerán sus borradores y postulaciones enviadas."
              : "Your drafts and submitted applications will appear here."}
          </p>
        )}
      </section>
    </Shell>
  );
}
