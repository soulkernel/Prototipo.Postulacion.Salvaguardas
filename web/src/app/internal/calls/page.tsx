import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer, getCalls, getRequestTime } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
import { CallEditor } from "@/components/call-editor";
import { CallPreview } from "@/components/call-preview";
export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; view?: string }>;
}) {
  await requireViewer(["grants_manager", "administrator"]);
  const locale = await getLocale();
  const es = locale === "es";
  const calls = await getCalls();
  const params = await searchParams;
  const now = await getRequestTime();
  const selected = params.edit ? calls.find((c) => c.id === params.edit) : null;
  const viewed = params.view ? calls.find((c) => c.id === params.view) : null;
  if (
    (params.edit && (!selected || selected.status !== "draft")) ||
    (params.view && !viewed)
  )
    notFound();
  return (
    <Shell locale={locale} internal>
      <Link href="/internal">← {es ? "Panel interno" : "Staff workspace"}</Link>
      <h1>{es ? "Convocatorias" : "Calls"}</h1>
      {viewed ? (
        <section className="live-card">
          <Link className="button secondary" href="/internal/calls">
            {es ? "Volver a convocatorias" : "Back to calls"}
          </Link>
          <CallPreview call={viewed} locale={locale} />
        </section>
      ) : (
        <>
          <div className="call-actions">
            <Link className="button secondary" href="/internal/calls">
              {es ? "Preparar nueva convocatoria" : "Prepare a new call"}
            </Link>
          </div>
          <div className="live-grid">
            {calls.map((c) => (
              <section className="live-card" key={c.id}>
                <span className="eyebrow">
                  {c.code} ·{" "}
                  {c.status === "draft"
                    ? es
                      ? "Borrador"
                      : "Draft"
                    : c.status === "published"
                      ? es
                        ? "Publicada"
                        : "Published"
                      : c.status === "closed"
                        ? es
                          ? "Cerrada"
                          : "Closed"
                        : es
                          ? "Archivada"
                          : "Archived"}
                </span>
                <h2>
                  {(es ? c.title_es : c.title_en) ||
                    (es ? "Sin título" : "Untitled")}
                </h2>
                {c.status === "published" && (
                  <p>
                    {c.opens_at && Date.parse(c.opens_at) > now
                      ? es
                        ? "Pendiente de apertura"
                        : "Awaiting opening"
                      : c.closes_at && Date.parse(c.closes_at) <= now
                        ? es
                          ? "Fuera del plazo de postulación"
                          : "Application period ended"
                        : es
                          ? "Abierta para postulaciones"
                          : "Open for applications"}
                  </p>
                )}
                <Link
                  className="button secondary"
                  href={
                    c.status === "draft"
                      ? `/internal/calls?edit=${c.id}`
                      : `/internal/calls?view=${c.id}`
                  }
                >
                  {c.status === "draft"
                    ? es
                      ? "Editar y revisar borrador"
                      : "Edit and review draft"
                    : es
                      ? "Ver convocatoria"
                      : "View call"}
                </Link>
              </section>
            ))}
          </div>
          <CallEditor
            key={selected?.id ?? "new"}
            initialCall={selected ?? null}
            locale={locale}
            now={now}
          />
        </>
      )}
    </Shell>
  );
}
