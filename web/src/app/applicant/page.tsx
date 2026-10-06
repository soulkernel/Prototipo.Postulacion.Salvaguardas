import { getRequestTime } from "@/lib/data";
import Link from "next/link";
import { requireViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { statusLabel } from "@/lib/fields";
import { Shell } from "@/components/shell";
import { createDraft } from "./actions";
import { signOut } from "@/app/auth/actions";
export default async function ApplicantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const requestTime = await getRequestTime();
  const viewer = await requireViewer(["applicant"]);
  const locale = await getLocale();
  const es = locale === "es";
  const params = await searchParams;
  const calls = (await getCalls()).filter(
    (c) =>
      c.status === "published" &&
      Date.parse(c.opens_at) <= requestTime &&
      Date.parse(c.closes_at) > requestTime,
  );
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
        </div>
        <form action={signOut}>
          <button className="button secondary">
            {es ? "Cerrar sesión" : "Sign out"}
          </button>
        </form>
      </div>
      {params.error && (
        <div role="alert" className="auth-error">
          {es
            ? "No fue posible abrir el borrador. Compruebe que la convocatoria está abierta."
            : "The draft could not be opened. Check that the call is open."}
        </div>
      )}
      <section className="live-card">
        <h2>{es ? "Iniciar una postulación" : "Start an application"}</h2>
        {calls.length ? (
          <form className="live-form" action={createDraft}>
            <label>
              {es ? "Convocatoria" : "Call"}
              <select name="call_id" required>
                <option value="">
                  {es ? "Seleccione una convocatoria" : "Select a call"}
                </option>
                {calls.map((c) => (
                  <option key={c.id} value={c.id}>
                    {es ? c.title_es : c.title_en}
                  </option>
                ))}
              </select>
            </label>
            <button className="button primary">
              {es ? "Crear borrador" : "Create draft"}
            </button>
          </form>
        ) : (
          <p>
            {es
              ? "No hay convocatorias abiertas para recibir postulaciones."
              : "No calls are currently open for applications."}
          </p>
        )}
      </section>
      <section className="live-card">
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
