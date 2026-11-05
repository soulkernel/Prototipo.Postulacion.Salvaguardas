import { InboxPagination } from "@/components/inbox-pagination";
import { inboxPaging, type InboxPage } from "@/lib/inbox-page";
import { ModuleHeading } from "@/components/module-heading";
import { InboxFilters } from "@/components/inbox-filters";
import { resolveFilters } from "@/lib/inbox-filters";
import Link from "@/components/feedback-link";
import { ActionLink } from "@/components/action-link";
import { requireReadViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { roleLabels, statusLabel } from "@/lib/fields";
export default async function InternalPage({
  searchParams,
}: {
  searchParams: Promise<{
    call?: string;
    category?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const { db, profile } = await requireReadViewer([
    "grants_manager",
    "sustainability_reviewer",
    "project_coordinator",
    "committee_member",
    "administrator",
  ]);
  const locale = await getLocale();
  const es = locale === "es";
  const query = await searchParams;
  const calls = await getCalls();
  const filters = resolveFilters(calls, query, locale);
  const paging = inboxPaging(query);
  const { data, error } = await db.rpc("internal_application_page", {
    filter_call: filters.call === "all" ? null : filters.call,
    filter_category: filters.category === "all" ? null : filters.category,
    requested_page: paging.page,
    page_size: paging.size,
  });
  if (error || !data) throw new Error("Cannot load application page");
  const result = data as InboxPage;
  const filtered = result.items;
  const returnTo =
    "/internal?" +
    new URLSearchParams({
      call: filters.call,
      category: filters.category,
      page: String(result.page),
      size: String(result.page_size),
    });
  const categoryLabel = (id: string) =>
    filters.options.find((c) => c.id === id)?.title || "—";
  return (
    <Shell locale={locale} internal>
      <ModuleHeading
        title={es ? "Expedientes y decisiones" : "Applications and decisions"}
      >
        <p>
          {profile.full_name} ·{" "}
          {profile.access_kind === "academic"
            ? es
              ? "Evaluación académica"
              : "Academic evaluation"
            : roleLabels[profile.role][es ? 0 : 1]}
        </p>
      </ModuleHeading>
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
        {(profile.role === "administrator" ||
          profile.user_admin_scope !== "none") && (
          <Link href="/internal/users">
            {es ? "Gestión de usuarios" : "User management"}
          </Link>
        )}
      </nav>
      <InboxFilters
        es={es}
        pageSize={result.page_size}
        call={filters.call}
        category={filters.category}
        categories={filters.options}
        calls={calls.map((c) => ({
          id: c.id,
          title: es ? c.title_es : c.title_en,
        }))}
      />
      <div className="live-metrics internal-summary-metrics">
        <div>
          {es ? "Convocatorias" : "Calls"}
          <strong>{filters.call === "all" ? calls.length : 1}</strong>
        </div>
        <div>
          {es ? "Expedientes recibidos" : "Applications received"}
          <strong>{result.total}</strong>
        </div>
        <div>
          {es ? "En revisión" : "In review"}
          <strong>{result.in_review}</strong>
        </div>
        <div>
          {es
            ? "Notas conceptuales preseleccionadas"
            : "Shortlisted concept notes"}
          <strong>{result.shortlisted}</strong>
        </div>
        <div>
          {es ? "Convenios firmados" : "Signed agreements"}
          <strong>{result.signed}</strong>
        </div>
      </div>
      <section className="live-card">
        <h2>{es ? "Bandeja de expedientes" : "Application inbox"}</h2>
        <p>
          {result.total}{" "}
          {es
            ? "expedientes coinciden con los filtros."
            : "applications match the filters."}
        </p>
        {filtered?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{es ? "Referencia" : "Reference"}</th>
                  <th>{es ? "Proyecto" : "Project"}</th>
                  <th>
                    {es
                      ? "Proponente / Responsable"
                      : "Applicant / Contact person"}
                  </th>
                  <th>{es ? "Categoría" : "Category"}</th>
                  <th>{es ? "Etapa" : "Stage"}</th>
                  <th>{es ? "Último envío" : "Last submitted"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.reference_code}</td>
                    <td>{a.title}</td>
                    <td>
                      <div>{a.proponent || a.contact || "—"}</div>
                      {a.proponent &&
                        a.contact &&
                        a.proponent.toLocaleLowerCase(locale) !==
                          a.contact.toLocaleLowerCase(locale) && (
                          <div className="inbox-contact">{a.contact}</div>
                        )}
                    </td>
                    <td>{categoryLabel(a.category)}</td>
                    <td>{statusLabel(a.status, locale)}</td>
                    <td>
                      {new Date(a.submitted_at).toLocaleString(locale, {
                        timeZone: "Pacific/Galapagos",
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>
                      <ActionLink
                        compact
                        ariaLabel={`${es ? "Revisar expediente" : "Review application"}: ${a.title}`}
                        href={
                          "/internal/applications/" +
                          a.id +
                          "?returnTo=" +
                          encodeURIComponent(returnTo)
                        }
                      >
                        {es ? "Revisar" : "Review"}
                      </ActionLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            {es
              ? "No hay expedientes recibidos que coincidan con estos filtros."
              : "No received applications match these filters."}
          </p>
        )}
        <InboxPagination
          page={result.page}
          pages={result.pages}
          total={result.total}
          pageSize={result.page_size}
          call={filters.call}
          category={filters.category}
          locale={locale}
        />
      </section>
    </Shell>
  );
}
