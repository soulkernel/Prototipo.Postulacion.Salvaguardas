import { InboxFilters } from "@/components/inbox-filters";
import { resolveFilters } from "@/lib/inbox-filters";
import Link from "@/components/feedback-link";
import { requireReadViewer, getCalls } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { roleLabels, statusLabel } from "@/lib/fields";
export default async function InternalPage({
  searchParams,
}: {
  searchParams: Promise<{ call?: string; category?: string }>;
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
  const apps: {
    id: string;
    reference_code: string;
    status: string;
    title: string;
    proponent: string;
    contact: string;
    stage: number;
    call_id: string;
    category: string;
  }[] = [];
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await db
      .from("applications")
      .select("id,call_id,reference_code,status,stage")
      .not("submitted_at", "is", null)
      .order("updated_at", { ascending: false })
      .order("id")
      .range(offset, offset + 249);
    if (error) throw new Error("Cannot read applications");
    if (!data?.length) break;
    const titles = new Map<
      string,
      { title: string; proponent: string; contact: string; category: string }
    >();
    for (let versionOffset = 0; ; versionOffset += 250) {
      const { data: versions, error: versionError } = await db
        .from("application_versions")
        .select("application_id,revision,payload")
        .in(
          "application_id",
          data.map((a) => a.id),
        )
        .order("revision", { ascending: false })
        .order("id")
        .range(versionOffset, versionOffset + 249);
      if (versionError) throw new Error("Cannot read submitted versions");
      for (const version of versions || []) {
        if (!titles.has(version.application_id))
          titles.set(version.application_id, {
            title: String(version.payload?.concept?.title || ""),
            category: String(version.payload?.concept?.category_id || ""),
            proponent: String(
              version.payload?.concept?.applicant_name || "",
            ).trim(),
            contact: String(
              version.payload?.concept?.contact_name || "",
            ).trim(),
          });
      }
      if (!versions || versions.length < 250) break;
    }
    apps.push(
      ...data.map((a) => ({
        ...a,
        title: titles.get(a.id)?.title || a.reference_code,
        proponent: titles.get(a.id)?.proponent || "",
        contact: titles.get(a.id)?.contact || "",
        category: titles.get(a.id)?.category || "",
      })),
    );
    if (data.length < 250) break;
  }
  const calls = await getCalls();
  const filters = resolveFilters(calls, await searchParams, locale);
  const filtered = apps.filter(
    (a) =>
      (filters.call === "all" || a.call_id === filters.call) &&
      (filters.category === "all" || a.category === filters.category),
  );
  const returnTo =
    "/internal?" +
    new URLSearchParams({ call: filters.call, category: filters.category });
  const categoryLabel = (id: string) =>
    filters.options.find((c) => c.id === id)?.title || "—";
  return (
    <Shell locale={locale} internal>
      <div className="live-title">
        <div>
          <h1>
            {es ? "Expedientes y decisiones" : "Applications and decisions"}
          </h1>
          <p>
            {profile.full_name} ·{" "}
            {profile.access_kind === "academic"
              ? es
                ? "Evaluación académica"
                : "Academic evaluation"
              : roleLabels[profile.role][es ? 0 : 1]}
          </p>
        </div>
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
        {(profile.role === "administrator" ||
          profile.user_admin_scope !== "none") && (
          <Link href="/internal/users">
            {es ? "Gestión de usuarios" : "User management"}
          </Link>
        )}
      </nav>
      <InboxFilters
        es={es}
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
          <strong>{filtered?.length || 0}</strong>
        </div>
        <div>
          {es ? "En revisión" : "In review"}
          <strong>
            {filtered?.filter((a) =>
              ["submitted", "under_review", "phase2_submitted"].includes(
                a.status,
              ),
            ).length || 0}
          </strong>
        </div>
        <div>
          {es
            ? "Notas conceptuales preseleccionadas"
            : "Shortlisted concept notes"}
          <strong>{filtered.filter((a) => a.stage === 2).length}</strong>
        </div>
        <div>
          {es ? "Convenios firmados" : "Signed agreements"}
          <strong>
            {filtered?.filter((a) => a.status === "contract_signed").length ||
              0}
          </strong>
        </div>
      </div>
      <section className="live-card">
        <h2>{es ? "Bandeja de expedientes" : "Application inbox"}</h2>
        <p>
          {filtered.length}{" "}
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
                      <Link
                        href={
                          "/internal/applications/" +
                          a.id +
                          "?returnTo=" +
                          encodeURIComponent(returnTo)
                        }
                      >
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
              ? "No hay expedientes recibidos que coincidan con estos filtros."
              : "No received applications match these filters."}
          </p>
        )}
      </section>
    </Shell>
  );
}
