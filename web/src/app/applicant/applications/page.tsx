import Link from "next/link";
import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { statusLabel } from "@/lib/fields";
import { Shell } from "@/components/shell";
import { signOut } from "@/app/auth/actions";
import { DeleteDraft } from "@/components/delete-draft";
export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;
  const viewer = await requireViewer(["applicant"]);
  const locale = await getLocale();
  const es = locale === "es";
  const { data: rows, error } = await viewer.db
    .from("applications")
    .select(
      "id,reference_code,payload,status,updated_at,submitted_at,revision,stage,deletion_pending,application_versions(id)",
    )
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
          <SubmitButton
            className="button secondary"
            pendingLabel={es ? "Cerrando sesión…" : "Signing out…"}
          >
            {es ? "Cerrar sesión" : "Sign out"}
          </SubmitButton>
        </form>
      </div>
      <section className="live-card" id="expedientes">
        {params.deleted === "1" && (
          <p role="status">{es ? "Borrador eliminado." : "Draft deleted."}</p>
        )}
        <h2>{es ? "Expedientes" : "Applications"}</h2>
        {rows?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{es ? "Referencia" : "Reference"}</th>
                  <th>{es ? "Proyecto" : "Project"}</th>
                  <th>{es ? "Estado" : "Status"}</th>
                  <th>{es ? "Último guardado" : "Last saved"}</th>
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
                      {new Date(row.updated_at).toLocaleString(locale, {
                        timeZone: "Pacific/Galapagos",
                      })}
                    </td>
                    <td>
                      <div className="draft-row-actions">
                        {!row.deletion_pending && (
                          <Link
                            className="button secondary draft-row-action"
                            href={"/applicant/" + row.id}
                          >
                            {row.status === "draft" && !row.submitted_at
                              ? es
                                ? "Continuar borrador"
                                : "Continue draft"
                              : es
                                ? "Abrir"
                                : "Open"}
                          </Link>
                        )}
                        {row.status === "draft" &&
                          row.stage === 1 &&
                          !row.submitted_at &&
                          !row.application_versions?.length && (
                            <DeleteDraft
                              id={row.id}
                              revision={row.revision}
                              title={
                                row.payload?.concept?.title ||
                                (es ? "Sin título" : "Untitled")
                              }
                              reference={row.reference_code}
                              category={
                                row.payload?.concept?.category_id === "small"
                                  ? es
                                    ? "Pequeña"
                                    : "Small"
                                  : row.payload?.concept?.category_id ===
                                      "medium"
                                    ? es
                                      ? "Mediana"
                                      : "Medium"
                                    : row.payload?.concept?.category_id ===
                                        "large"
                                      ? es
                                        ? "Grande"
                                        : "Large"
                                      : row.payload?.concept?.category_id || ""
                              }
                              locale={locale}
                              pending={row.deletion_pending}
                            />
                          )}
                      </div>
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
import { SubmitButton } from "@/components/submit-button";
